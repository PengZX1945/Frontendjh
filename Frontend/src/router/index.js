import { createRouter, createWebHistory } from "vue-router";

// 统一读取登录凭证，和 request.js 里的请求拦截器保持一致
export function getToken() {
    return localStorage.getItem("token");
}

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
        meta: { needLogin: true },
        children: [
            {
                path: "user", // 子路由用相对路径，最终地址为 /app/User
                name: "user",
                // 这里需要补上() => import("../views/User.vue")
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
    const token = getToken();

    // 匹配到的路由中只要有一层标了 needLogin，就说明该页面需要登录
    const needLogin = to.matched.some(record => record.meta?.needLogin);

    if (needLogin && !token) {
        // 带上 redirect，登录成功后可以跳回原页面
        next({ path: "/login", query: { redirect: to.fullPath } });
        return;
    }

    // 已登录时再访问登录页，直接放行到目标页面
    if (to.name === "login" && token) {
        next({ path: typeof to.query.redirect === "string" ? to.query.redirect : "/app" });
        return;
    }

    next();
});

export default router