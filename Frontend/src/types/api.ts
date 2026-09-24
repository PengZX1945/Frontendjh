import type { AxiosRequestConfig } from 'axios'

/**
 * 后端统一响应信封：`{ code, msg, data }`。
 * 约定 `code === 0` 表示成功（部分实现返回 200，判定逻辑见 `isSuccessCode`）。
 */
export interface ApiEnvelope<TData> {
  code: number
  msg: string
  data: TData
}

/**
 * 本层对外的请求选项：在 axios 原生配置之上增加两个开关。
 *
 * - `skipAuth`：不注入 `Authorization` 头（登录、注册等公开接口使用）
 * - `silent`：不弹全局错误提示，由调用页面自行渲染（页面已有内联错误提示时使用）
 */
export interface ApiRequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean
  silent?: boolean
}

/** 错误分类，便于调用方按来源分支处理 */
export type ApiErrorKind = 'http' | 'business' | 'network' | 'timeout'
