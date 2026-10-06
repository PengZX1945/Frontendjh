<template>
    <header class="nav-bar">
        <div class="nav-inner">
            <!-- 左侧：平台 logo + 名称 -->
            <div class="brand">
                <span class="brand-logo" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="7" width="18" height="13" rx="2" />
                        <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
                        <path d="M3 12h18" />
                    </svg>
                </span>
                <span class="brand-name">失物招领平台</span>
            </div>

            <!-- 中间：主导航，先做静态骨架，后续接入各页面路由 -->
            <nav class="nav-links">
                <a v-for="item in navLinks" :key="item.key" class="nav-link"
                    :class="{ 'is-active': item.key === activeKey }"
                    :aria-current="item.key === activeKey ? 'page' : undefined"
                    href="#" @click.prevent>{{ item.label }}</a>
            </nav>

            <!-- 右侧：未登录显示登录/注册入口；已登录（含管理员）显示方形头像 + 悬停菜单 -->
            <div class="nav-actions">
                <el-dropdown v-if="!userStore.isLoggedIn" placement="bottom">
                    <el-button type="warning" size="small" @click="goLogin"> 未登录 </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="goLogin">登录</el-dropdown-item>
                            <el-dropdown-item @click="goRegister">注册</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

                <el-dropdown v-else trigger="hover" placement="bottom-end" @command="handleUserCommand">
                    <span class="user-avatar" role="button" tabindex="0" aria-label="用户菜单">
                        <el-avatar :size="32" shape="square" class="avatar-box" />
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item disabled>
                                当前身份：{{ userStore.username }}（{{ ROLE_LABEL[userStore.role] }}）
                            </el-dropdown-item>
                            <el-dropdown-item command="profile">用户信息</el-dropdown-item>
                            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ROLE_LABEL } from '../api/localAccounts';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();

/** 顶部导航项 */
const navLinks = [
    { key: 'found', label: '招领启事' },
    { key: 'lost', label: '寻物启事' },
    { key: 'publish', label: '发布' },
    { key: 'mine', label: '我的' }
];

const activeKey = ref('found');

function goLogin(): void {
    router.push('/login');
}
function goRegister(): void {
    router.push('/register');
}

/** 头像下拉菜单：退出登录复用 store 的登出逻辑，管理员与普通用户一致 */
function handleUserCommand(command: string): void {
    if (command === 'logout') {
        userStore.logout();
        router.push('/login');
        return;
    }
    // 'profile'：用户信息页尚未实现，先留空
}
</script>

<style scoped>
.nav-bar {
    background: #fff;
    border-bottom: 1px solid #ebeef5;
}

.nav-inner {
    display: flex;
    align-items: center;
    gap: 56px;
    height: 54px;
    padding: 0 30px;
    box-sizing: border-box;
}

.brand {
    display: flex;
    align-items: center;
    gap: 8px;
}

.brand-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    background: #409eff;
    color: #fff;
}

.brand-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
}

.nav-link {
    position: relative;
    display: flex;
    align-items: center;
    height: 54px;
    font-size: 14px;
    color: #606266;
    text-decoration: none;
}

.nav-link:hover {
    color: #409eff;
}

.nav-link.is-active {
    color: #409eff;
    font-weight: 500;
}

.nav-link.is-active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    border-radius: 1px;
    background: #409eff;
}

.nav-actions {
    margin-left: auto;
}

.user-avatar {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
}

.avatar-box {
    /* 默认空白头像：给浅灰底，占位更明显 */
    background: #dcdfe6;
    border-radius: 6px;
}
</style>
