import axios from "axios";
import { router } from "../router";
import { useUserStore } from "../stores/user";
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

        // 10002：未登录 / 登录已过期（错误码表要求前端跳登录页），清凭证后带上回跳地址
        if (body?.code === ErrorCode.UNAUTHORIZED) {
            useUserStore().logout();
            if (router.currentRoute.value.name !== "login") {
                router.push({
                    name: "login",
                    query: { redirect: router.currentRoute.value.fullPath },
                });
            }
        }

        return body;
    },
    (error) => {
        const message =
            error.response?.data?.message ||
            error.message || "网络错误";

        // 401：登录态失效，先清掉本地凭证，否则守卫会认为“已登录”把用户弹回首页
        const is401 =
            error.response?.status === 401 ||
            error.response?.data?.status === 401;

        if (is401) {
            useUserStore().logout();
            router.push({ name: "login" });
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
 * @param {{ username: string, password: string, nickname: string, contact: string }} data
 * @returns {Promise<{ code?: number, msg?: string, data?: unknown }>?}
 * @see 错误码 10005 用户名已存在，完整表见 api/errorCode.ts
 */
export function register(data) {
    return req.post("/auth/register", data);
}
