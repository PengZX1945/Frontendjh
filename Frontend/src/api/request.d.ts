/**
 * request.js 是 JS 文件，这里补充类型声明，
 * 让 TS 页面（登录 / 注册）在导入时不再报 TS7016「隐式拥有 any 类型」。
 */

/** 登录 / 注册请求体 */
export interface AuthPayload {
  username: string
  password: string
}

/** 后端统一返回结构：code === 0 表示成功 */
export interface AuthResult {
  code?: number
  msg?: string
  data?: {
    token?: string
    [key: string]: unknown
  } | null
}

export declare const req: import('axios').AxiosInstance

export declare function login(data: AuthPayload): Promise<AuthResult>

export declare function register(data: AuthPayload): Promise<AuthResult>
