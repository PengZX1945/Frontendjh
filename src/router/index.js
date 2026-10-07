import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

const routes = [
    {
        // 根路径直达公开列表：未登录（游客）也能浏览招领/寻物与公开详情
        path: "/",
        redirect: "/home/found"
    },
    {
        path: "/login",
        name: "login",
        component: () => import("../views/Userlogin.vue")
    },
    {
        path: "/register",
        name: "register",
        component: () => import("../views/Userregister.vue")
    },
    {
        path: "/home",
        name: "home",
        component: () => import("../views/Home.vue"),
        // 父路由标记后，所有子路由都受保护（靠 to.matched 判断）
        meta: { needLogin: false },
        // 进首页默认落在招领启事列表
        redirect: { name: 'found' },
        children: [
            {
                path: 'found',
                name: 'found',
                component: () => import('../views/FoundList.vue'),
                meta: { needLogin: false }
            },
            {
                path: 'lost',
                name: 'lost',
                component: () => import('../views/LostList.vue'),
                meta: { needLogin: false }
            },
            {
                path: 'details/:id',
                name: 'details',
                component: () => import('../views/ItemDetails.vue'),
                meta: { needLogin: false }
            },
            {
                path: 'profile',
                name: 'profile',
                component: () => import('../views/Profile.vue'),
                meta: { needLogin: true }
            },
            {
                path: 'edit-profile',
                name: 'edit-profile',
                component: () => import('../views/EditProfile.vue'),
                meta: { needLogin: true }
            },
            {
                path: 'change-password',
                name: 'change-password',
                component: () => import('../views/ChangePassword.vue'),
                meta: { needLogin: true }
            },
            {
                path: 'myitems',
                name: 'myitems',
                component: () => import('../views/MyItems.vue'),
                meta: { needLogin: true }
            },
            {
                path: 'myclaims',
                name: 'myclaims',
                component: () => import('../views/MyClaims.vue'),
                meta: { needLogin: true }
            },
            {
                path: 'additem',
                name: 'additem',
                component: () => import('../views/AddItem.vue'),
                meta: { needLogin: true }
            }
        ]
    },
    {
        path: '/admin',
        name: 'admin',
        component: () => import('../layouts/AdminLayout.vue'),
        meta: { needLogin: true, needAdmin: true },
        redirect: { name: 'admin-items' },
        children: [
            {
                path: 'items',
                name: 'admin-items',
                component: () => import('../views/AdminItems.vue'),
                meta: { needLogin: true, needAdmin: true }
            },
            {
                path: 'claims',
                name: 'admin-claims',
                component: () => import('../views/AdminClaims.vue'),
                meta: { needLogin: true, needAdmin: true }
            },
            {
                path: 'users',
                name: 'admin-users',
                component: () => import('../views/AdminUsers.vue'),
                meta: { needLogin: true, needAdmin: true, needSysAdmin: true }
            },
            {
                path: 'announcements',
                name: 'admin-announcements',
                component: () => import('../views/AdminAnnouncements.vue'),
                meta: { needLogin: true, needAdmin: true, needSysAdmin: true }
            },
            {
                path: 'stats',
                name: 'admin-stats',
                component: () => import('../views/AdminStats.vue'),
                meta: { needLogin: true, needAdmin: true }
            }
        ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
]

// 具名导出：api/request.js 的 401 处理需要用它做跳转
export const router = createRouter({
    history: createWebHistory(),
    routes
});//路由规则+history

// 保护网站，未登录时跳到登录页
router.beforeEach((to, from, next) => {
    // 登录态统一由 Pinia store 提供（内部会自动从 storage 恢复）
    const userStore = useUserStore();

    // 匹配到的路由中只要有一层标了 needLogin:true，就说明该页面需要登录
    const needLogin = to.matched.some(record => record.meta?.needLogin);

    if (needLogin && !userStore.isLoggedIn) {
        // 带上 redirect，登录成功后可以跳回原页面
        next({ path: "/login", query: { redirect: to.fullPath } });
        return;
    }

    // 管理员专属页面：非管理员一律回前台
    const needAdmin = to.matched.some(record => record.meta?.needAdmin);
    if (needAdmin && !userStore.isAdmin) {
        next("/home");
        return;
    }

    // 系统管理员专属页面：非 sys_admin 回审核管理首页
    const needSysAdmin = to.matched.some(record => record.meta?.needSysAdmin);
    if (needSysAdmin && !userStore.isSysAdmin) {
        next({ name: "admin-items" });
        return;
    }

    // 已登录时再访问登录页，直接放行到目标页面
    if (to.name === "login" && userStore.isLoggedIn) {
        const redirect = to.query.redirect;
        next({ path: typeof redirect === "string" && redirect ? redirect : "/home" });
        return;
    }

    next();
});

export default router