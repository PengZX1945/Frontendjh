/**
 * 日期展示工具。
 * 后端时间字段是字符串（可能是 ISO 或 `YYYY-MM-DD HH:mm:ss`），这里统一解析与展示，
 * 解析失败时原样回显，避免出现 `Invalid Date`。
 */

/** 解析后端时间字符串；失败返回 null */
export function parseDateValue(value: string): Date | null {
  const text = value.trim()
  if (text === '') return null
  // 兼容不带 `T` 的写法，Safari 对 `2026-10-07 10:00:00` 的解析不稳定
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(text) ? text.replace(' ', 'T') : text
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** 补零到两位；数字与字符串都吃，避免同一文件里出现两个只差入参类型的补零函数 */
function pad(value: number | string): string {
  return String(value).padStart(2, '0')
}

/** `2026-10-07 10:30` */
export function formatDateTime(value: string): string {
  const parsed = parseDateValue(value)
  if (parsed === null) return value
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

/** `2026-10-07` */
export function formatDate(value: string): string {
  const parsed = parseDateValue(value)
  if (parsed === null) return value
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
}

/** 相对时间：刚刚 / 12 分钟前 / 3 小时前 / 5 天前；超过 30 天回落为绝对日期 */
export function formatRelativeTime(value: string, now: Date = new Date()): string {
  const parsed = parseDateValue(value)
  if (parsed === null) return value

  const diffSeconds = Math.floor((now.getTime() - parsed.getTime()) / 1000)
  if (diffSeconds < 0) return formatDate(value)
  if (diffSeconds < 60) return '刚刚'
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} 分钟前`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} 小时前`
  if (diffSeconds < 86400 * 30) return `${Math.floor(diffSeconds / 86400)} 天前`
  return formatDate(value)
}

/** 转成 `<input type="datetime-local">` 需要的本地值 */
export function toDateTimeLocalValue(value: string): string {
  const parsed = parseDateValue(value)
  if (parsed === null) return ''
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

/**
 * 把 datetime-local 的取值补成后端常见格式：
 * `2026-10-07T10:30` → `2026-10-07 10:30:00`
 *
 * 逐段取值、缺省才补零。别写成 `timePart.split(':')[0]` 再按长度判断 ——
 * 那样只拿到小时（`'14'`），分钟会被丢掉并整点回退成 `00:00`。
 */
export function fromDateTimeLocalValue(value: string): string {
  const text = value.trim()
  if (text === '') return ''
  const [datePart = '', timePart = ''] = text.split('T')
  const [hour = '', minute = ''] = timePart.split(':')
  return `${datePart} ${pad(hour || '00')}:${pad(minute || '00')}:00`
}
