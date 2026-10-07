import { formLimits, itemCategoryOptions } from '@/constants/domain'
import type { ItemFormDraft } from '@/types/item'

/**
 * 表单校验规则。
 * 每个函数返回错误文案，空串表示通过 —— 便于页面按字段拼装 `errors` 对象，
 * 也便于单测直接断言函数的返回值。
 */

function checkTextLength(value: string, label: string, min: number, max: number): string {
  const text = value.trim()
  if (text === '') return `请填写${label}`
  if (text.length < min) return `${label}不能少于 ${min} 个字符`
  if (text.length > max) return `${label}不能超过 ${max} 个字符`
  return ''
}

export function validateUsername(value: string): string {
  const text = value.trim()
  if (text === '') return '请填写用户名'
  if (text.length < formLimits.usernameMinLength)
    return `用户名不能少于 ${formLimits.usernameMinLength} 个字符`
  if (text.length > formLimits.usernameMaxLength)
    return `用户名不能超过 ${formLimits.usernameMaxLength} 个字符`
  if (!/^[A-Za-z0-9_]+$/.test(text)) return '用户名只能包含字母、数字与下划线'
  return ''
}

export function validatePassword(value: string): string {
  if (value === '') return '请填写密码'
  if (value.length < formLimits.passwordMinLength)
    return `密码不能少于 ${formLimits.passwordMinLength} 个字符`
  if (value.length > formLimits.passwordMaxLength)
    return `密码不能超过 ${formLimits.passwordMaxLength} 个字符`
  return ''
}

export function validateConfirmPassword(password: string, confirmPassword: string): string {
  if (confirmPassword === '') return '请再次输入密码'
  if (password !== confirmPassword) return '两次输入的密码不一致'
  return ''
}

export function validateNickname(value: string): string {
  const text = value.trim()
  if (text === '') return '请填写昵称'
  if (text.length > formLimits.nicknameMaxLength)
    return `昵称不能超过 ${formLimits.nicknameMaxLength} 个字符`
  return ''
}

/** 联系方式：手机号、邮箱、微信/QQ 号都允许，只做「非空 + 长度 + 邮箱格式」的宽松校验 */
export function validateContact(value: string): string {
  const text = value.trim()
  if (text === '') return '请填写联系方式'
  if (text.length < 3) return '联系方式过短，请填写可用于联系的手机号或邮箱'
  if (text.length > formLimits.contactMaxLength)
    return `联系方式不能超过 ${formLimits.contactMaxLength} 个字符`
  if (text.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return '邮箱格式不正确'
  }
  return ''
}

export function validateItemName(value: string): string {
  return checkTextLength(value, '物品名称', 2, formLimits.itemNameMaxLength)
}

export function validateItemCategory(value: string): string {
  if (value.trim() === '') return '请选择物品分类'
  if (!itemCategoryOptions.includes(value as (typeof itemCategoryOptions)[number])) {
    return '请选择列表中的物品分类'
  }
  return ''
}

export function validateItemLocation(value: string): string {
  const text = value.trim()
  if (text === '') return ''
  if (text.length > formLimits.locationMaxLength)
    return `地点不能超过 ${formLimits.locationMaxLength} 个字符`
  return ''
}

export function validateGetLocation(value: string): string {
  const text = value.trim()
  if (text === '') return '请填写领取地点'
  if (text.length > formLimits.locationMaxLength)
    return `领取地点不能超过 ${formLimits.locationMaxLength} 个字符`
  return ''
}

export function validateGetContact(value: string): string {
  return validateContact(value).replace('联系方式', '领取联系方式')
}

export function validateItemDescription(value: string): string {
  if (value.length > formLimits.descriptionMaxLength)
    return `描述不能超过 ${formLimits.descriptionMaxLength} 个字符`
  return ''
}

export function validateClaimReason(value: string): string {
  const text = value.trim()
  if (text === '') return '请填写认领理由'
  if (text.length < formLimits.claimReasonMinLength)
    return `认领理由不能少于 ${formLimits.claimReasonMinLength} 个字符`
  if (text.length > formLimits.reasonMaxLength)
    return `认领理由不能超过 ${formLimits.reasonMaxLength} 个字符`
  return ''
}

export function validateAnnouncementTitle(value: string): string {
  return checkTextLength(value, '公告标题', 2, formLimits.announcementTitleMaxLength)
}

export function validateAnnouncementContent(value: string): string {
  return checkTextLength(value, '公告正文', 2, formLimits.announcementContentMaxLength)
}

/** 发布 / 编辑物品表单的整体校验，返回「字段 → 首条错误」 */
export function validateItemForm(draft: ItemFormDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  const itemNameError = validateItemName(draft.itemName)
  if (itemNameError !== '') errors.itemName = itemNameError

  const categoryError = validateItemCategory(draft.category)
  if (categoryError !== '') errors.category = categoryError

  const locationError = validateItemLocation(draft.location)
  if (locationError !== '') errors.location = locationError

  const getLocationError = validateGetLocation(draft.getLocation)
  if (getLocationError !== '') errors.getLocation = getLocationError

  const getContactError = validateGetContact(draft.getContact)
  if (getContactError !== '') errors.getContact = getContactError

  const descriptionError = validateItemDescription(draft.description)
  if (descriptionError !== '') errors.description = descriptionError

  return errors
}
