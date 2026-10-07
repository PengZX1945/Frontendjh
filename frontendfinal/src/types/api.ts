import type { AxiosRequestConfig } from 'axios'

/**
 * 后端统一响应信封：`{ code, msg, data }`。
 * 约定 `code === 0` 表示成功（部分实现沿用 HTTP 语义返回 200，判定见 `isSuccessCode`）。
 */
export interface ApiEnvelope<TData> {
  code: number
  msg: string
  data: TData
}

/**
 * 本层对外的请求选项：在 axios 原生配置之上增加两个开关。
 *
 * - `skipAuth`：不注入 `Authorization` 头（登录、注册、列表等公开接口使用）
 * - `silent`：不弹全局错误提示，由调用页面自行渲染（页面已有内联错误提示时使用）
 */
export interface ApiRequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean
  silent?: boolean
}

/** 错误分类，便于调用方按来源分支处理 */
export type ApiErrorKind = 'http' | 'business' | 'network' | 'timeout'

/**
 * 分页结果。
 *
 * 接口文档的分页响应只给 `items` 数组、不给总数，因此「是否还有下一页」由前端按
 * 「本页条数是否等于 page_size」推断 —— 见 `buildPagedResult`。
 */
export interface PagedResult<TRecord> {
  records: TRecord[]
  /** 本页是否装满；装不满说明已到末页 */
  hasMore: boolean
}

/** 分页查询的公共入参 */
export interface PageQuery {
  page?: number
  pageSize?: number
}
