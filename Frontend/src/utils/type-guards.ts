import type { ApiEnvelope } from '@/types/api'

/** 判断是否为普通对象（排除 null 与数组） */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 安全取字符串：非字符串或纯空白一律归一为空串 */
export function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** 安全取数字：无法解析时回落为 0 */
export function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value)
    if (Number.isFinite(parsedValue)) return parsedValue
  }
  return 0
}

/** 判断响应体是否符合 `{ code, msg, data }` 信封结构 */
export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return isRecord(value) && typeof value.code === 'number'
}

/** 接口文档约定 0 为成功；部分实现沿用 HTTP 语义返回 200，一并放行 */
export function isSuccessCode(code: number): boolean {
  return code === 0 || code === 200
}

/**
 * 取出信封里的业务数据。
 * 后端若直接返回裸对象（未套信封），则原样返回，避免调用方拿到 undefined。
 */
export function readEnvelopeData(rawBody: unknown): unknown {
  return isApiEnvelope(rawBody) ? rawBody.data : rawBody
}
