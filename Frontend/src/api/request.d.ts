/**
 * request.js 是 JS 文件，这里补充类型声明，
 * 让 TS 页面（登录 / 注册）在导入时不再报 TS7016「隐式拥有 any 类型」。
 */

/** 登录请求体 */
export interface AuthPayload {
  username: string
  password: string
}

/** 注册请求体：比登录多昵称与联系方式 */
export interface RegisterPayload extends AuthPayload {
  /** 昵称，最长 64 字符 */
  nickname: string
  /** 联系方式，最长 128 字符 */
  contact: string
}

/** 后端统一返回结构：code === 0 表示成功，其余错误码见 api/errorCode.ts */
export interface AuthResult {
  code?: number
  msg?: string
  data?: {
    token?: string
    [key: string]: unknown
  } | null
}

export declare const req: import('axios').AxiosInstance

/** 登录接口；错误码 10006 用户名或密码错误、10010 账号已被禁用 */
export declare function login(data: AuthPayload): Promise<AuthResult>

/** 注册接口；错误码 10005 用户名已存在 */
export declare function register(data: RegisterPayload): Promise<AuthResult>
