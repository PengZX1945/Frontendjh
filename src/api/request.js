import axios from "axios";
import { router } from "../router";
import { useUserStore } from "../stores/user";
import { useAuthStore } from "../stores/ui";
import { ErrorCode } from "./errorCode";

export const req = axios.create({
    baseURL: "/api",
    timeout: 5000,
});

// 请求拦截器：自动携带 token
// 在模块加载时注册一次即可，暴露成函数反复调用会重复注册拦截器。
req.interceptors.request.use(
    (config) => {
        const { token } = useUserStore();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器：成功时直接返回 data，失败时统一抛出可读的错误信息
req.interceptors.response.use(
    (res) => {
        const body = res.data;

        // 10002：未登录 / 登录已过期。清凭证后回到首页并弹出登录窗
        if (body?.code === ErrorCode.UNAUTHORIZED) {
            useUserStore().logout();
            useAuthStore().openAuth('login', '/home');
            router.push('/home/found');
        }

        return body;
    },
    (error) => {
        const message =
            error.response?.data?.msg ||
            error.response?.data?.message ||
            error.message || "网络错误";

        // 401：登录态失效，先清掉本地凭证，回到首页并弹出登录窗
        // 主动退出（_skipAuthRedirect）时后端可能也返回 401，但属于用户主动登出，不应弹窗/跳转
        const is401 =
            error.response?.status === 401 ||
            error.response?.data?.status === 401;

        if (is401 && !error.config?._skipAuthRedirect) {
            useUserStore().logout();
            useAuthStore().openAuth('login', '/home');
            router.push('/home/found');
        }

        return Promise.reject(new Error(message));
    }
);

/**
 * 登录接口
 * @param {{ username: string, password: string }} data
 * @returns {Promise<{ code?: number, msg?: string, data?: { token?: string } }>?}
 * @see 错误码 10006 用户名或密码错误、10010 账号已被禁用，完整表见 api/errorCode.ts
 */
export function login(data) {
    return req.post("/auth/login", data);
}

/**
 * 注册接口
 * @param {{ username: string, password: string }} data
 * @returns {Promise<{ code?: number, msg?: string, data?: unknown }>?}
 * @see 错误码 10005 用户名已存在，完整表见 api/errorCode.ts
 */
export function register(data) {
    return req.post("/auth/register", data);
}

/**
 * 获取当前登录用户信息（真实后端登录后用于回填角色等）
 */
export function getProfile() {
    return req.get("/auth/profile");
}
