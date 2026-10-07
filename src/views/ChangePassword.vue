<template>
    <div class="change-pwd-page">
        <el-card class="pwd-card">
            <h2 class="page-title">修改密码</h2>
            <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
                <el-form-item label="当前密码" prop="oldPassword">
                    <el-input v-model="form.oldPassword" type="password" show-password placeholder="请输入当前密码" />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                    <el-input v-model="form.newPassword" type="password" show-password placeholder="请输入新密码" />
                </el-form-item>
                <el-form-item label="确认新密码" prop="confirmPassword">
                    <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
                </el-form-item>
                <el-form-item>
                    <el-button type="warning" :loading="saving" @click="save">修改密码</el-button>
                    <el-button @click="goBack">返回</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { changePassword } from '../api/user';
import { ErrorCode } from '../api/errorCode';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const formRef = ref<FormInstance>();
const saving = ref(false);

const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const rules: FormRules = {
    oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
    confirmPassword: [{
        validator: (_rule, value, cb) => (value === form.newPassword ? cb() : cb(new Error('两次输入的密码不一致'))),
        trigger: 'blur',
    }],
};

function goBack(): void {
    router.push({ name: 'profile' });
}

async function save(): Promise<void> {
    if (!formRef.value) return;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    saving.value = true;
    try {
        const res = await changePassword(form.oldPassword, form.newPassword);
        if (res?.code !== ErrorCode.SUCCESS) {
            ElMessage.error(res?.msg || '修改失败');
            return;
        }
        ElMessage.success('密码已修改，请重新登录');
        // 修改密码后强制重新登录
        userStore.logout();
        router.push('/home/found');
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '修改失败');
    } finally {
        saving.value = false;
    }
}
</script>

<style scoped>
.change-pwd-page {
    max-width: 520px;
    margin: 0 auto;
}
.pwd-card {
    border-radius: 12px;
    padding: 4px 8px 8px;
}
.page-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}
</style>
