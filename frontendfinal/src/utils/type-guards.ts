import type { ApiEnvelope } from '@/types/api'

/** 判断是否为普通对象（排除 null 与数组） */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 安全取字符串：非字符串一律归一为空串，字符串去掉首尾空白 */
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

/** 安全取字符串数组：过滤掉非字符串与空串 */
export function toTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => toText(entry)).filter((entry) => entry !== '')
}

/**
 * 从候选键里取第一个非空字符串。
 * 用于兼容后端字段命名未定稿的情况（如 `token` / `access_token` / `jwt`）。
 */
export function pickText(record: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const candidate = toText(record[key])
    if (candidate !== '') return candidate
  }
  return ''
}

/**
 * 从候选键里取第一个非空对象（用于在 `data` / `session` / `auth` 之间找用户信息）。
 */
export function pickRecord(
  record: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> | null {
  for (const key of keys) {
    const candidate = record[key]
    if (isRecord(candidate)) return candidate
  }
  return null
}

/** 判断响应体是否符合 `{ code, msg, data }` 信封结构 */
export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return isRecord(value) && typeof value.code === 'number'
}

/** 接口约定 0 为成功；部分实现沿用 HTTP 语义返回 200，一并放行 */
export function isSuccessCode(code: number): boolean {
  return code === 0 || code === 200
}

/**
 * 取出信封里的业务数据。
 * 后端若直接返回裸对象（未套信封），原样返回，避免调用方拿到 undefined。
 */
export function readEnvelopeData(rawBody: unknown): unknown {
  return isApiEnvelope(rawBody) ? rawBody.data : rawBody
}

/**
 * 归一化「记录数组」形态：兼容 `data.items` / `data` 直接是数组 / 裸数组三种形态。
 * 接口文档里列表响应的键名不完全统一（items / claims / users / announcements），
 * 这里按调用方给出的候选键依次尝试。
 */
export function readRecordList(rawBody: unknown, keys: readonly string[]): unknown[] {
  const data = readEnvelopeData(rawBody)
  if (Array.isArray(data)) return data
  if (isRecord(data)) {
    for (const key of keys) {
      const candidate = data[key]
      if (Array.isArray(candidate)) return candidate
    }
  }
  return []
}
