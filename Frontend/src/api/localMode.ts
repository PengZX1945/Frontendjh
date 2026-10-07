/**
 * 本地兜底总开关。
 *
 * 后端 /api 还没就绪时，帖子与个人信息的请求都走 localStorage，
 * 页面逻辑与真实接口完全一致；后端上线后把它改成 false 即可只走真实接口。;
 */
export const USE_LOCAL_API = true;
