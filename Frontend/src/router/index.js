import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "../stores/user";

const routes = [
    {
        path: "/",
        redirect: "/login"
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
        children: [
            {
                path: "FoundList", // 子路由用相对路径，最终地址为 /app/User
                name: "FoundList",
                component: () => import("../views/FoundList.vue"),
                meta: { needLogin: false }
            },
            {
                path: 'ItemDetaills',
                name: 'ItemDetaills',
                component: () => import('../views/ItemDetaills.vue'),
                meta: { needLogin: false }
            },
            {
                path: 'LostList',
                name: 'LostList',
                component: () => import('../views/LostList.vue'),
                meta: { needLogin: false }
            },
            {
                path: 'MyItems',
                name: 'MyItems',
                component: () => import('../views/MyItems.vue'),
                meta: { needLogin: true }
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

    // 已登录时再访问登录页，直接放行到目标页面
    if (to.name === "login" && userStore.isLoggedIn) {
        const redirect = to.query.redirect;
        next({ path: typeof redirect === "string" && redirect ? redirect : "/home" });
        return;
    }

    next();
});

export default router