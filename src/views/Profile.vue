<template>
    <div class="profile-page" v-loading="loading">
        <el-card v-if="profile" class="profile-card">
            <div class="profile-head">
                <span class="avatar-big">
                    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor"
                        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </span>
                <div class="profile-name">{{ profile.nickname || profile.username }}</div>
                <el-tag size="small" type="warning" round>{{ ROLE_LABEL[(profile.role || 'user') as keyof typeof ROLE_LABEL] }}</el-tag>
            </div>

            <el-descriptions :column="1" border class="profile-desc">
                <el-descriptions-item label="用户名">{{ profile.username }}</el-descriptions-item>
                <el-descriptions-item label="昵称">{{ profile.nickname || '—' }}</el-descriptions-item>
                <el-descriptions-item label="角色">{{ ROLE_LABEL[(profile.role || 'user') as keyof typeof ROLE_LABEL] }}</el-descriptions-item>
                <el-descriptions-item label="联系方式">{{ profile.contact || '—' }}</el-descriptions-item>
            </el-descriptions>

            <div class="profile-actions">
                <el-button type="primary" plain @click="goEditProfile">编辑档案</el-button>
                <el-button type="warning" plain @click="goChangePassword">修改密码</el-button>
                <el-button type="danger" plain @click="doLogout">退出登录</el-button>
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getProfile } from '../api/request';
import { logout as apiLogout } from '../api/user';
import { ErrorCode } from '../api/errorCode';
import { ROLE_LABEL } from '../api/localAccounts';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

const profile = ref<{
    id?: number
    username?: string
    nickname?: string
    role?: string
    contact?: string
} | null>(null);
const loading = ref(false);

async function load(): Promise<void> {
    loading.value = true;
    try {
        const res = await getProfile();
        if (res?.code === ErrorCode.SUCCESS && res.data) profile.value = res.data;
        else ElMessage.error(res?.msg || '加载用户信息失败');
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '加载用户信息失败');
    } finally {
        loading.value = false;
    }
}

/** 个人档案页退出登录：先通知后端登出，再清本地，并跳回首页 */
function doLogout(): void {
    apiLogout().catch(() => {});
    userStore.logout();
    router.push('/home/found');
}

function goEditProfile(): void {
    router.push({ name: 'edit-profile' });
}
function goChangePassword(): void {
    router.push({ name: 'change-password' });
}

onMounted(load);
</script>

<style scoped>
.profile-page {
    max-width: 640px;
    margin: 0 auto;
}
.profile-card {
    border-radius: 12px;
}
.profile-head {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 4px 20px;
}
.avatar-big {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #409eff, #36b3f0);
    color: #fff;
}
.profile-name {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}
.profile-desc {
    font-size: 14px;
}
.profile-actions {
    margin-top: 24px;
    text-align: center;
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
}
</style>
