import type { FormItemRule } from 'element-plus'

/**
 * 表单校验规则集中管理，注册页与个人中心共用同一套口径。
 * 登录页只校验「必填」，避免早期账号因复杂度规则被挡在门外。
 */

const usernamePattern = /^[a-zA-Z0-9_]+$/
const mobilePattern = /^1[3-9]\d{9}$/
const emailPattern = /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/
/** QQ 号 / 微信号一类短账号 */
const shortAccountPattern = /^[a-zA-Z0-9_-]{4,20}$/

export const minUsernameLength = 3
export const maxUsernameLength = 20
export const minPasswordLength = 6
export const maxPasswordLength = 32

export const usernameRules: FormItemRule[] = [
  { required: true, message: '请输入用户名', trigger: 'blur' },
  {
    min: minUsernameLength,
    max: maxUsernameLength,
    message: `用户名长度为 ${minUsernameLength} ~ ${maxUsernameLength} 个字符`,
    trigger: 'blur',
  },
  { pattern: usernamePattern, message: '用户名只能包含字母、数字与下划线', trigger: 'blur' },
]

export const loginPasswordRules: FormItemRule[] = [
  { required: true, message: '请输入密码', trigger: 'blur' },
]

export const registerPasswordRules: FormItemRule[] = [
  { required: true, message: '请输入密码', trigger: 'blur' },
  {
    min: minPasswordLength,
    max: maxPasswordLength,
    message: `密码长度为 ${minPasswordLength} ~ ${maxPasswordLength} 个字符`,
    trigger: 'blur',
  },
  {
    pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
    message: '密码需同时包含字母与数字',
    trigger: 'blur',
  },
]

export const nicknameRules: FormItemRule[] = [
  { required: true, message: '请输入昵称', trigger: 'blur' },
  { min: 1, max: 20, message: '昵称长度为 1 ~ 20 个字符', trigger: 'blur' },
]

export const contactRules: FormItemRule[] = [
  { required: true, message: '请输入联系方式', trigger: 'blur' },
  {
    validator: (_rule, value, callback) => {
      if (!isValidContact(value)) {
        callback(new Error('请填写手机号、邮箱、QQ 号或微信号'))
        return
      }
      callback()
    },
    trigger: 'blur',
  },
]

/** 新密码规则：注册页与修改密码共用 */
export const newPasswordRules: FormItemRule[] = registerPasswordRules

export const oldPasswordRules: FormItemRule[] = [
  { required: true, message: '请输入当前密码', trigger: 'blur' },
]

/**
 * 「确认密码」规则需要读取另一个字段，因此做成工厂函数。
 * `readPassword` 返回当前输入的新密码，保证校验始终与最新输入一致。
 */
export function createConfirmPasswordRules(readPassword: () => string): FormItemRule[] {
  return [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== readPassword()) {
          callback(new Error('两次输入的密码不一致'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ]
}

/** 联系方式：手机号 / 邮箱 / QQ 号 / 微信号，四选一即通过 */
export function isValidContact(value: unknown): boolean {
  const contact = typeof value === 'string' ? value.trim() : ''
  if (!contact || contact.length > 40) return false
  return (
    mobilePattern.test(contact) || emailPattern.test(contact) || shortAccountPattern.test(contact)
  )
}

/** 用户名：字母、数字、下划线，长度 3 ~ 20 */
export function isValidUsername(value: unknown): boolean {
  const username = typeof value === 'string' ? value.trim() : ''
  return (
    username.length >= minUsernameLength &&
    username.length <= maxUsernameLength &&
    usernamePattern.test(username)
  )
}

/** 密码：长度 6 ~ 32，且同时包含字母与数字 */
export function isValidPassword(value: unknown): boolean {
  const password = typeof value === 'string' ? value : ''
  return (
    password.length >= minPasswordLength &&
    password.length <= maxPasswordLength &&
    /[a-zA-Z]/.test(password) &&
    /\d/.test(password)
  )
}
