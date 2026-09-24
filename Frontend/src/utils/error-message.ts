import { ApiError } from '@/api/http'

/**
 * 把异常翻译成可展示的中文提示。
 * `ApiError` 的 message 已由请求层按「后端 msg → 状态码文案 → 传输层文案」兜底，直接使用即可。
 */
export function toErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof ApiError ? error.message : fallbackMessage
}
