import axios, { isAxiosError, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiEnvelope, ApiErrorKind, ApiRequestOptions } from '@/types/api'
import { readStoredToken } from '@/utils/auth-storage'
import { emitAuthExpired } from '@/utils/auth-events'
import {
  isApiEnvelope,
  isSuccessCode,
  isRecord,
  readEnvelopeData,
  toText,
} from '@/utils/type-guards'

/**
 * 请求层：全站唯一的 axios 实例。
 *
 * 职责边界：
 * 1. 注入 JWT（登录、注册等公开接口可通过 `skipAuth` 关闭）
 * 2. 校验业务信封 `{ code, msg, data }`，`code !== 0` 一律抛出 ApiError
 * 3. 把超时 / 断网 / HTTP 状态码翻译成可读的中文提示
 * 4. 非静默请求遇到 401 时广播「登录失效」事件（不在此处操作路由与 store，避免循环依赖）
 */

/** 开发态由 Vite 代理转发；生产态由 Nginx 反向代理，故默认使用同源前缀 */
const defaultApiBaseUrl = '/api'

/** 接口根地址：可用 `VITE_API_BASE` 直接指向远端后端 */
export const apiBaseUrl = import.meta.env.VITE_API_BASE?.trim() || defaultApiBaseUrl

const requestTimeoutMs = 15000

/** 接口错误：页面可按 `kind` / `status` 分支处理 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly code: number | undefined

  constructor(
    kind: ApiErrorKind,
    message: string,
    details: { status?: number; code?: number } = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = details.status
    this.code = details.code
  }
}

export const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: requestTimeoutMs,
})

http.interceptors.request.use((requestConfig) => {
  const { skipAuth } = requestConfig as ApiRequestOptions
  const authToken = readStoredToken()
  if (authToken && !skipAuth) {
    requestConfig.headers.set('Authorization', `Bearer ${authToken}`)
  }
  return requestConfig
})

http.interceptors.response.use(
  (response) => {
    const responseBody: unknown = response.data
    if (!isApiEnvelope(responseBody) || isSuccessCode(responseBody.code)) return response

    const businessError = new ApiError('business', toText(responseBody.msg) || '请求未能完成', {
      code: responseBody.code,
      status: response.status,
    })
    reportApiError(businessError, response.config as ApiRequestOptions)
    return Promise.reject(businessError)
  },
  (requestError: unknown) => {
    const apiError = toApiError(requestError)
    reportApiError(apiError, readRequestOptions(requestError))
    return Promise.reject(apiError)
  },
)

/** GET：返回原始响应，业务数据用 `readResponsePayload` 取出 */
export function getJson<TData>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<AxiosResponse<ApiEnvelope<TData>>> {
  return http.get<ApiEnvelope<TData>>(url, options)
}

/** POST：注册、登录、退出登录 */
export function postJson<TData>(
  url: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<AxiosResponse<ApiEnvelope<TData>>> {
  return http.post<ApiEnvelope<TData>>(url, body, options)
}

/** PUT：修改个人信息、修改密码 */
export function putJson<TData>(
  url: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<AxiosResponse<ApiEnvelope<TData>>> {
  return http.put<ApiEnvelope<TData>>(url, body, options)
}

/**
 * 取出信封里的业务数据。
 * 后端若未按文档套信封（直接返回裸对象），则原样返回，避免页面拿到 undefined 后崩溃。
 */
export function readResponsePayload<TData>(response: AxiosResponse): TData {
  return readEnvelopeData(response.data) as TData
}

/** 校验失败、业务失败之外的情况统一交给这里翻译 */
function toApiError(requestError: unknown): ApiError {
  if (requestError instanceof ApiError) return requestError

  if (!isAxiosError(requestError)) {
    return new ApiError('network', '请求发送失败，请稍后重试')
  }

  const status = requestError.response?.status
  const transportCode = requestError.code ?? ''

  if (transportCode === 'ECONNABORTED' || transportCode === 'ETIMEDOUT') {
    return new ApiError('timeout', '请求超时，请检查网络后重试', { status })
  }

  if (!requestError.response) {
    return new ApiError('network', '无法连接服务器，请确认后端服务已启动', {})
  }

  const serverMessage = readServerErrorMessage(requestError.response.data)
  return new ApiError('http', serverMessage || toFriendlyHttpMessage(status), { status })
}

/** 后端在 4xx/5xx 响应里给出 `msg` 时优先采用，其次按状态码给出通用文案 */
function readServerErrorMessage(responseBody: unknown): string {
  if (!isRecord(responseBody)) return ''
  return toText(responseBody.msg)
}

function toFriendlyHttpMessage(status: number | undefined): string {
  switch (status) {
    case 400:
      return '请求参数有误，请检查填写内容'
    case 401:
      return '登录状态已失效，请重新登录'
    case 403:
      return '没有权限执行该操作'
    case 404:
      return '请求的接口不存在'
    case 406:
      return '接口不接受当前请求格式'
    case 409:
      return '该数据已存在，请更换后重试'
    case 423:
      return '账号已被锁定，请联系管理员'
    case 500:
      return '服务器内部错误，请稍后重试'
    default:
      return status ? `请求失败（HTTP ${status}）` : '请求失败，请稍后重试'
  }
}

/**
 * 统一上报：401 会话失效走「广播给 App.vue 统一处理」，其余错误在此处弹提示。
 *
 * 401 矩阵：
 * - 非静默 401 → 广播会话失效（App.vue 负责清凭证、跳登录页、给一条提示），此处不再重复提示
 * - 静默 401（页面自行处理）→ 完全忽略，绝不触发退出登录
 * - 登录/注册等 `skipAuth` 请求的 401 → 属于业务失败（密码错误），按普通错误处理
 */
function reportApiError(apiError: ApiError, options: ApiRequestOptions): void {
  const isSessionExpired = apiError.status === 401 && !options.skipAuth && !options.silent

  if (isSessionExpired) {
    emitAuthExpired()
    return
  }

  if (!options.silent) ElMessage.error(apiError.message)
}

/** 从 axios 错误对象上取回本次请求的选项（用于判断 silent / skipAuth） */
function readRequestOptions(requestError: unknown): ApiRequestOptions {
  if (!isAxiosError(requestError)) return {}
  return (requestError.config ?? {}) as ApiRequestOptions
}
