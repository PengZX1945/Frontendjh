<template>
    <!-- append-to-body：通过 teleport 把弹窗挂到 body 下，覆盖在整页之上 -->
    <el-dialog v-model="visible" title="个人信息" width="680px" append-to-body :close-on-click-modal="false"
        @closed="handleClosed">
        <div v-loading="loading" class="profile-body">
            <!-- 头像在上，整体靠左布局 -->
            <div class="avatar-block">
                <el-avatar :size="84" shape="square" class="profile-avatar" />
                <span class="avatar-name">{{ form.nickname || form.username }}</span>
            </div>

            <el-form ref="formRef" :model="form" :rules="rules" label-width="88px" @submit.prevent>
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="form.username" disabled />
                </el-form-item>

                <el-form-item label="昵称" prop="nickname">
                    <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="64" />
                </el-form-item>

                <el-form-item label="电话号码" prop="contact">
                    <el-input v-model="form.contact" placeholder="请输入联系方式" maxlength="128" />
                </el-form-item>

                <el-divider content-position="left">修改密码</el-divider>

                <el-form-item label="原密码" prop="old_password">
                    <el-input v-model="form.old_password" type="password" show-password
                        placeholder="不修改密码请留空" />
                </el-form-item>

                <el-form-item label="新密码" prop="new_password">
                    <el-input v-model="form.new_password" type="password" show-password
                        placeholder="8-64 位，不含特殊字符" />
                </el-form-item>

                <el-form-item label="确认新密码" prop="confirm_password">
                    <el-input v-model="form.confirm_password" type="password" show-password
                        placeholder="请再次输入新密码" />
                </el-form-item>
            </el-form>

            <p class="profile-tip">注：用户名不可修改；不修改密码时密码区留空即可</p>
        </div>

        <template #footer>
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSubmit">修改</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { changePassword, fetchProfile, updateProfile } from '../api/profile';
import { ErrorCode, isSuccess, resolveErrorMessage } from '../api/errorCode';
import { validateContact, validateNickname } from '../api/profileMeta';
import { validateConfirm, validatePassword } from '../utils/validators';
import { useUserStore } from '../stores/user';

/** 开关由父组件（NavBar）持有 */
const visible = defineModel<boolean>({ default: false });

const router = useRouter();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);

const form = reactive({
    username: '',
    nickname: '',
    contact: '',
    old_password: '',
    new_password: '',
    confirm_password: '',
});

/** 密码区填了任意一个字段，就认为用户要走改密码流程 */
const passwordTouched = computed(() =>
    Boolean(form.old_password || form.new_password || form.confirm_password),
);

/** el-form 的校验器：把纯函数规则包成它要的回调形式 */
function makeValidator(check: (value: string) => string) {
    return (_rule: unknown, value: unknown, callback: (error?: Error) => void): void => {
        const message = check(typeof value === 'string' ? value : '');
        if (message) callback(new Error(message));
        else callback();
    };
}

// 密码区的规则只在用户填过密码后才生效，否则点「修改」会被空密码卡住。
// 原密码只校验非空：它是已有密码，长度下限由后端判定（文档要求 8-64，过严会挡住本地调试账号）
const rules = computed<FormRules>(() => ({
    nickname: [{ validator: makeValidator(validateNickname), trigger: 'blur' }],
    contact: [{ validator: makeValidator(validateContact), trigger: 'blur' }],
    old_password: passwordTouched.value
        ? [{ validator: makeValidator((value) => (value ? '' : '请输入原密码')), trigger: 'blur' }]
        : [],
    new_password: passwordTouched.value
        ? [{ validator: makeValidator(validatePassword), trigger: 'blur' }]
        : [],
    confirm_password: passwordTouched.value
        ? [{ validator: makeValidator((value) => validateConfirm(form.new_password, value)), trigger: 'blur' }]
        : [],
}));

function clearPasswordFields(): void {
    form.old_password = '';
    form.new_password = '';
    form.confirm_password = '';
}

/** 先用 store 里的值立刻渲染，再拉接口覆盖，避免弹窗空白一下 */
function fillFromStore(): void {
    form.username = userStore.username;
    form.nickname = userStore.nickname || userStore.username;
    form.contact = userStore.contact;
}

async function loadProfile(): Promise<void> {
    loading.value = true;
    try {
        const res = await fetchProfile();

        if (!isSuccess(res?.code) || !res.data) {
            ElMessage.error(resolveErrorMessage(res?.code, res?.msg, '获取个人信息失败'));
            return;
        }

        const profile = res.data;
        form.username = profile.username || form.username;
        form.nickname = profile.nickname ?? '';
        form.contact = profile.contact ?? '';

        // 资料与 id 同步进 store：id 是 1.5 / 1.6 的 user_id 来源
        userStore.setProfile(form.nickname, form.contact);
        userStore.setUserId(profile.id);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '获取个人信息失败');
    } finally {
        loading.value = false;
    }
}

// 每次打开都重新取一次资料，同时清掉上一次残留的密码
watch(visible, (opened) => {
    if (!opened) return;

    clearPasswordFields();
    formRef.value?.clearValidate();
    fillFromStore();
    loadProfile();
});

function handleClosed(): void {
    // 关掉后不留密码在内存里
    clearPasswordFields();
    formRef.value?.clearValidate();
}

function handleCancel(): void {
    visible.value = false;
}

async function handleSubmit(): Promise<void> {
    if (!formRef.value) return;

    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    const nickname = form.nickname.trim();
    const contact = form.contact.trim();
    const needChangePassword = passwordTouched.value;

    // 1.5 / 1.6 都要 query user_id，拿不到就别发请求（等下次打开弹窗重新取）
    const userId = userStore.userId;
    if (!userId) {
        ElMessage.error('未获取到用户 ID，请关闭后重试');
        return;
    }

    saving.value = true;
    try {
        // 先改密码：失败就整体中断，避免出现「昵称改了、密码没改」的半成品状态
        if (needChangePassword) {
            const res = await changePassword(userId, {
                old_password: form.old_password,
                new_password: form.new_password,
            });

            if (!isSuccess(res?.code)) {
                // 10006 在改密码场景表示原密码错误，优先用后端文案，
                // 别套登录场景的「用户名或密码错误」
                const message = res?.code === ErrorCode.LOGIN_FAILED
                    ? res.msg || '原密码错误'
                    : resolveErrorMessage(res?.code, res?.msg);
                ElMessage.error(message);
                return;
            }
        }

        const res = await updateProfile(userId, { nickname, contact });
        if (!isSuccess(res?.code)) {
            ElMessage.error(resolveErrorMessage(res?.code, res?.msg, '保存失败，请稍后重试'));
            return;
        }

        userStore.setProfile(nickname, contact);

        if (needChangePassword) {
            // 接口约定：改完密码前端要重新登录
            ElMessage.success('密码修改成功，请重新登录');
            visible.value = false;
            userStore.logout();
            router.push({ name: 'login' });
            return;
        }

        ElMessage.success('修改成功');
        visible.value = false;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '保存失败，请稍后重试');
    } finally {
        saving.value = false;
    }
}
</script>

<style scoped>
.profile-body {
    min-height: 120px;
}

.avatar-block {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
}

.profile-avatar {
    /* 默认空白头像，和导航栏保持一致 */
    background: #dcdfe6;
    border-radius: 8px;
}

.avatar-name {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.profile-tip {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #909399;
}
</style>
