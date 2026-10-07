<template>
    <div class="edit-profile-page">
        <el-card class="edit-card">
            <h2 class="page-title">编辑档案</h2>
            <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
                <el-form-item label="昵称" prop="nickname">
                    <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="32" />
                </el-form-item>
                <el-form-item label="联系方式" prop="contact">
                    <el-input v-model="form.contact" placeholder="手机号 / 微信号" maxlength="64" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="saving" @click="save">保存</el-button>
                    <el-button @click="goBack">返回</el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { getProfile } from '../api/request';
import { updateProfile } from '../api/user';
import { ErrorCode } from '../api/errorCode';

const router = useRouter();
const formRef = ref<FormInstance>();
const saving = ref(false);

const form = reactive({ nickname: '', contact: '' });
const rules: FormRules = {
    nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    contact: [{ required: true, message: '请输入联系方式', trigger: 'blur' }],
};

async function load(): Promise<void> {
    const res = await getProfile();
    if (res?.code === ErrorCode.SUCCESS && res.data) {
        form.nickname = res.data.nickname ?? '';
        form.contact = res.data.contact ?? '';
    }
}

function goBack(): void {
    router.push({ name: 'profile' });
}

async function save(): Promise<void> {
    if (!formRef.value) return;
    const valid = await formRef.value.validate().catch(() => false);
    if (!valid) return;

    saving.value = true;
    try {
        const res = await updateProfile(form.nickname.trim(), form.contact.trim());
        if (res?.code !== ErrorCode.SUCCESS) {
            ElMessage.error(res?.msg || '保存失败');
            return;
        }
        ElMessage.success('资料已更新');
        router.push({ name: 'profile' });
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '保存失败');
    } finally {
        saving.value = false;
    }
}

onMounted(load);
</script>

<style scoped>
.edit-profile-page {
    max-width: 520px;
    margin: 0 auto;
}
.edit-card {
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
