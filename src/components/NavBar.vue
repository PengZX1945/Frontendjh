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

            <!-- 中间：主导航，切换 main 区的子路由 -->
            <nav class="nav-links">
                <router-link v-for="item in navLinks" :key="item.key" class="nav-link"
                    :to="{ name: item.routeName }" active-class="is-active">{{ item.label }}</router-link>
            </nav>

            <!-- 右侧：未登录显示登录/注册入口；已登录（含管理员）显示方形头像 + 悬停菜单 -->
            <div class="nav-actions">
                <span v-if="!userStore.isLoggedIn" ref="loginBtnRef" class="auth-entry">
                    <el-button type="primary" size="small" @click="goLogin">登录</el-button>
                </span>

                <template v-else>
                    <!-- 管理入口：单独分割，独立于普通用户导航 -->
                    <div v-if="userStore.isAdmin" class="admin-entry">
                        <router-link to="/admin/items" active-class="is-admin-active" class="admin-link">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.13V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.13-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.13V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.35.14.77.23 1.13.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.6Z" />
                            </svg>
                            审核管理
                        </router-link>
                        <router-link v-if="userStore.isSysAdmin" to="/admin/users" active-class="is-admin-active" class="admin-link">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            用户管理
                        </router-link>
                        <router-link v-if="userStore.isSysAdmin" to="/admin/announcements" active-class="is-admin-active" class="admin-link">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="14" rx="2" />
                                <path d="M8 9h8M8 13h5" />
                            </svg>
                            公告管理
                        </router-link>
                        <router-link v-if="userStore.isAdmin" to="/admin/stats" active-class="is-admin-active" class="admin-link">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                                stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 3v18h18" />
                                <path d="M7 14l3-4 3 3 4-6" />
                            </svg>
                            数据统计
                        </router-link>
                    </div>
                    <el-divider v-if="userStore.isAdmin" direction="vertical" class="nav-divider" />

                    <el-dropdown trigger="hover" placement="bottom-end" @command="handleUserCommand">
                    <span class="user-avatar user-name" role="button" tabindex="0" aria-label="用户信息"
                        :title="userStore.username">
                        {{ userStore.username }}
                    </span>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="profile">查看档案</el-dropdown-item>
                            <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                    </el-dropdown>
                </template>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ROLE_LABEL } from '../api/localAccounts';
import { logout as apiLogout } from '../api/user';
import { useUserStore } from '../stores/user';
import { useAuthStore } from '../stores/ui';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

/** 顶部导航项：routeName 对应 router 里的子路由名 */
const navLinks = computed(() => {
    // 公开导航：游客（未登录）也能访问列表与公开详情
    const links = [
        { key: 'found', label: '招领启事', routeName: 'found' },
        { key: 'lost', label: '寻物启事', routeName: 'lost' },
    ];
    // 需登录的导航：登录后才显示（「审核管理」单独分割在右侧，不混入主导航）
    if (userStore.isLoggedIn) {
        links.push({ key: 'publish', label: '发布', routeName: 'additem' });
        links.push({ key: 'mine', label: '我的', routeName: 'myitems' });
    }
    return links;
});

const loginBtnRef = ref<HTMLElement | null>(null);

/** 在登录按钮正下方弹出登录/注册浮层（右上角紧贴按钮） */
function openAt(el: HTMLElement | null): void {
    if (!el) {
        authStore.openAuth('login');
        return;
    }
    const rect = el.getBoundingClientRect();
    authStore.openAuth('login', '/home', {
        top: rect.bottom + 10,
        right: Math.max(8, window.innerWidth - rect.right),
    });
}
function goLogin(): void {
    openAt(loginBtnRef.value);
}

/** 头像悬停菜单：查看档案 / 退出登录 */
function handleUserCommand(command: string): void {
    if (command === 'profile') {
        router.push({ name: 'profile' });
        return;
    }
    if (command === 'logout') {
        // 先通知后端登出（令牌失效/黑名单），再清本地登录态；后端失败也继续本地退出
        apiLogout().catch(() => {});
        userStore.logout();
        // 在用户档案界面退出后跳回首页；其余界面停留在当前页面不变
        if (router.currentRoute.value.name === 'profile') {
            router.push('/home/found');
        }
    }
}
</script>

<style scoped>
.nav-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: saturate(180%) blur(10px);
    -webkit-backdrop-filter: saturate(180%) blur(10px);
    border-bottom: 1px solid rgba(235, 238, 245, 0.9);
    box-shadow: 0 2px 14px rgba(0, 0, 0, 0.06);
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
    font-size: 17px;
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
    font-size: 15px;
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
    display: flex;
    align-items: center;
    gap: 10px;
}
.auth-entry .el-button {
    min-width: 76px;
}
.admin-entry {
    display: flex;
    align-items: center;
}
.admin-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 15px;
    color: #606266;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.2s;
}
.admin-link:hover {
    color: #409eff;
    background: #ecf5ff;
}
.admin-link.is-admin-active {
    color: #fff;
    background: #409eff;
}
.nav-divider {
    height: 18px;
    border-color: #dcdfe6;
}

.user-avatar {
    display: inline-flex;
    align-items: center;
    font-size: 17px;
    font-weight: 500;
    color: #409eff;
    cursor: pointer;
    line-height: 54px;
    outline: none;
    transition: color 0.2s, transform 0.2s;
}
.user-avatar:hover {
    color: #36b3f0;
    transform: scale(1.15);
}
</style>
