/**
 * 
 * 把登录/注册规则集中在这里，避免两个页面各写一套导致提示不一致。
 */

/** 账号：4-32 位，只能用字母、数字、下划线 */
const error_username = /^[A-Za-z0-9_]{4,32}$/
/** 密码：8-64 位，只能用字母、数字、下划线 */
const error_password = /^[A-Za-z0-9_]{8,64}$/

/** 昵称 / 联系方式的最大长度，与注册接口的入参限制保持一致 */
const NICKNAME_MAX = 64
const CONTACT_MAX = 128


/**
 * 登录页的账号校验：非空 + 格式要求。
 * 
 */
export function validateLoginUsername(value: string): string {
  if (!value) return '请输入账号'
  if (!error_username.test(value)) return '账号需为 4-32 位，包含字母、数字或下划线'
  return ''
}

/** 注册页的账号校验：需要满足格式要求 */
export function validateRegisterUsername(value: string): string {
  if (!value) return '请输入账号'
  if (!error_username.test(value)) return '账号需为 4-32 位，包含字母、数字或下划线'
  return ''
}

/** 密码：8-64 位，且不能包含特殊字符 */
export function validatePassword(value: string): string {
  if (!value) return '请输入密码'
  if (/\s/.test(value)) return '密码不能包含空格'
  if (value.length < 8) return '密码长度不能少于 8 位'
  if (value.length > 64) return '密码长度不能超过 64 位'
  if (!error_password.test(value)) return '密码不能包含特殊字符与空格'
  return ''
}

/**
 * 昵称：必填，最长 64 字符。
 * 昵称只用于展示，不限制字符合法性，中文 / 符号都允许。
 */
export function validateNickname(value: string): string {
  if (!value) return '请输入昵称'
  if (value.length > NICKNAME_MAX) return `昵称不能超过 ${NICKNAME_MAX} 个字符`
  return ''
}

/**
 * 联系方式：必填，最长 128 字符。
 * 后端只要求非空 + 长度，所以不限制是手机号还是邮箱，避免把合法输入卡掉。
 */
export function validateContact(value: string): string {
  if (!value) return '请输入联系方式'
  if (value.length > CONTACT_MAX) return `联系方式不能超过 ${CONTACT_MAX} 个字符`
  return ''
}

/** 确认密码：非空且与密码一致 */
export function validateConfirm(password: string, confirm: string): string {
  if (!confirm) return '请再次输入密码'
  if (confirm !== password) return '两次输入的密码不一致'
  return ''
}

/**
 * 密码强度：0 太短 / 1 弱 / 2 中 / 3 强。
 * 注册页用来做实时提示，不影响提交结果。
 */
export function passwordStrength(value: string): number {
  if (value.length < 6) return 0

  let score = 1
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1
  if (value.length >= 10 || /[^A-Za-z0-9]/.test(value)) score += 1
  return score
}

export const STRENGTH_TEXT = ['太短', '弱', '中', '强'] as const
