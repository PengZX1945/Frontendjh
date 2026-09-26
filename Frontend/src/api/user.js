import axios from "axios";
//全局性的配置：axios实例

export const req = axios.create({
    baseURL: "/api",
    timeout: 2000
});

function pt(){
    req.get("/api/auth/login");
}
//拦截器：判断是否有token，没token去登陆界面
//请求拦截(token);拦截器作用：再发送请求之前增加拦截，做自定义的处理之类的
export function requestInterceptor(){
    const requestinterceptor = req.interceptors.request.use(config => {
        const token = localStorage.getItem("token");
        console.log("请求拦截器执行");
        if(token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },(error) => {
        console.error(error);
        return Promise.reject(error);
    }); 
}
//移除拦截器：axios.interceptors.request.eject(requestinterceptor);
//处理错误
export function handleError(error){
    req.interceptors.response.use(
        res => res.data,
        err => Promise.reject(new Error(err.response?.data?.message || "网络错误"))
    );
}

export function login(data){
    return req.post('/login', data);
}
