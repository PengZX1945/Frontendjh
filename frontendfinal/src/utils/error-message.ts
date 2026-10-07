import { ApiError, businessCodeMessages, httpStatusMessages } from '@/api/api-error'

/**
 * 异常 → 可展示文案。
 *
 * 优先级：后端 `msg`（最贴近真实原因）→ 业务码表 → HTTP 状态码表 → 按错误类型兜底。
 * 页面拿到文案后直接渲染，不需要再判断错误类型。
 */
export function resolveErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message !== '' ? error.message : '操作失败，请稍后再试'
  }

  if (error.message !== '') return error.message

  if (error.kind === 'business') {
    return businessCodeMessages[error.code] ?? '操作失败，请稍后再试'
  }

  if (error.kind === 'http') {
    return httpStatusMessages[error.status] ?? `请求失败（HTTP ${error.status}）`
  }

  if (error.kind === 'timeout') {
    return '请求超时，请检查网络后重试'
  }

  return '无法连接服务器，请检查网络或稍后再试'
}

/** 会话失效文案：跳转登录页时的统一提示 */
export const authExpiredMessage = '登录状态已过期，请重新登录'
