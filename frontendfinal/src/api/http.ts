import axios, { type AxiosError } from 'axios'

import { ApiError } from '@/api/api-error'
import { readAuthToken } from '@/utils/auth-storage'
import { emitAuthExpired } from '@/utils/auth-events'
import { showErrorToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { isApiEnvelope, isSuccessCode, readEnvelopeData, toText } from '@/utils/type-guards'
import type { ApiRequestOptions } from '@/types/api'

/**
 * 全站唯一的 axios 实例。
 *
 * 职责边界（刻意收窄，避免反向依赖）：
 * 1. 注入 `Authorization: Bearer <token>`；
 * 2. 拆 `{ code, msg, data }` 信封，`code !== 0`（`200` 也视为成功）一律抛 `ApiError`；
 * 3. 把 axios 的各类失败翻译成 `ApiError`（http / business / network / timeout）；
 * 4. 会话失效只**广播事件**，不碰 store 与 router —— 真正的清理与跳转在 `App.vue`。
 *
 * 页面层不直接 import axios，一律走 `api/*-api.ts`。
 */
const apiBaseUrl = import.meta.env.VITE_API_BASE || '/api'

const httpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
})

/** 原始响应：信封被解析前的形态，登录接口需要用它做凭证探测 */
export interface RawApiResponse {
  body: unknown
  status: number
  headers: Record<string, string>
}

/** 把 axios 失败翻译成统一异常 */
function translateAxiosFailure(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    const message = error instanceof Error ? error.message : ''
    return new ApiError({ kind: 'network', message })
  }

  const axiosError = error as AxiosError<unknown>

  if (axiosError.response) {
    const { status, data } = axiosError.response
    // 后端可能用 4xx/5xx 承载业务错误码，此时按业务错误处理，优先用它的 msg
    if (isApiEnvelope(data)) {
      return new ApiError({
        kind: 'business',
        message: toText(data.msg),
        code: data.code,
        status,
      })
    }
    return new ApiError({ kind: 'http', message: '', status })
  }

  if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
    return new ApiError({ kind: 'timeout', message: '' })
  }

  return new ApiError({ kind: 'network', message: '' })
}

/** 失败后的统一处置：会话失效广播、或弹一次全局提示（静默请求跳过） */
function reportFailure(apiError: ApiError, options: { silent: boolean; skipAuth: boolean }): void {
  if (options.silent) return
  if (!options.skipAuth && apiError.isAuthExpired) {
    // 由 App.vue 统一提示一次并跳转登录页，避免与请求层各弹一条
    emitAuthExpired()
    return
  }
  showErrorToast(resolveErrorMessage(apiError))
}

/**
 * 发起请求并返回「原始响应」。
 * 只给需要访问完整响应体或响应头的调用方使用（当前是登录的凭证探测）。
 */
export async function sendRequest(options: ApiRequestOptions): Promise<RawApiResponse> {
  const { skipAuth = false, silent = false, headers, ...axiosOptions } = options

  const requestHeaders: Record<string, string> = {}
  if (typeof headers === 'object' && headers !== null) {
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') requestHeaders[key] = value
    }
  }
  if (!skipAuth) {
    const authToken = readAuthToken()
    if (authToken !== '') requestHeaders.Authorization = `Bearer ${authToken}`
  }

  try {
    const response = await httpClient.request<unknown>({
      ...axiosOptions,
      headers: requestHeaders,
    })

    const rawBody = response.data
    if (isApiEnvelope(rawBody) && !isSuccessCode(rawBody.code)) {
      throw new ApiError({
        kind: 'business',
        message: toText(rawBody.msg),
        code: rawBody.code,
        status: response.status,
      })
    }

    const responseHeaders: Record<string, string> = {}
    for (const [key, value] of Object.entries(response.headers)) {
      if (typeof value === 'string') responseHeaders[key] = value
    }

    return { body: rawBody, status: response.status, headers: responseHeaders }
  } catch (error) {
    const apiError = error instanceof ApiError ? error : translateAxiosFailure(error)
    reportFailure(apiError, { silent, skipAuth })
    throw apiError
  }
}

/** 发起请求并返回信封里的 `data`（绝大多数接口用这个） */
export async function request<TData>(options: ApiRequestOptions): Promise<TData> {
  const rawResponse = await sendRequest(options)
  return readEnvelopeData(rawResponse.body) as TData
}

/** 上传接口需要 multipart，单独给 axios 一个便捷出口，避免各页面重复拼 FormData */
export async function requestWithFormData<TData>(
  url: string,
  formData: FormData,
  options: ApiRequestOptions = {},
): Promise<TData> {
  return request<TData>({
    method: 'post',
    url,
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    ...options,
  })
}
