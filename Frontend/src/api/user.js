import axios from "axios";

export const req = axios.create({
    baseURL: "/api",
    timeout: 5000,
});

// 请求拦截器：自动携带 token
// 在模块加载时注册一次即可，暴露成函数反复调用会重复注册拦截器。
req.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器：成功时直接返回 data，失败时统一抛出可读的错误信息
req.interceptors.response.use(
    (res) => res.data,
    (error) => {
        const message =
            error.response?.data?.message ||
            error.response?.data?.msg ||
            error.message ||
            "网络错误";
        return Promise.reject(new Error(message));
    }
);

/**
 * 登录接口
 * @param {{ username: string, password: string }} data
 * @returns {Promise<{ code?: number, msg?: string, data?: { token?: string } }>?}
 */
export function login(data) {
    return req.post("/auth/login", data);
}
