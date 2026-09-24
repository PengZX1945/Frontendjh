import type { ProfileChangePayload, UserProfile } from '@/types/user'
import { isRecord, readEnvelopeData, toNumber, toText } from '@/utils/type-guards'
import { toUserRole } from '@/utils/user-role'

/**
 * 用户相关的响应归一化。
 *
 * 接口文档中同一份用户数据出现了两套字段名（`id` 与 `user_id`、下划线与小驼峰），
 * 这里统一适配为前端的 camelCase 模型，页面层只面对 `UserProfile`。
 */

/** 候选的用户 ID 字段名，覆盖文档中的 `id` / `user_id` 与常见驼峰写法 */
const userIdFieldNames = ['user_id', 'userId', 'id']

/** 候选的凭证字段名，覆盖常见后端实现 */
const authTokenFieldNames = ['token', 'access_token', 'accessToken', 'jwt', 'authorization']

/** 登录响应里可能包裹用户信息的字段名 */
const userObjectFieldNames = ['user', 'user_info', 'userInfo', 'profile']

/** 响应归一化为用户档案；字段缺失时给出安全默认值，保证界面不崩 */
export function toUserProfile(rawUser: unknown): UserProfile {
  const userRecord = isRecord(rawUser) ? rawUser : {}
  const username = toText(userRecord.username)

  return {
    userId: readUserId(userRecord),
    username,
    nickname: toText(userRecord.nickname) || username,
    role: toUserRole(toText(userRecord.role)),
    contact: toText(userRecord.contact),
  }
}

/** 同上，但入参为空时返回 null（用于「登录响应里未必带用户信息」的场景） */
export function toUserProfileOrNull(rawUser: unknown): UserProfile | null {
  return isRecord(rawUser) && Object.keys(rawUser).length > 0 ? toUserProfile(rawUser) : null
}

/** 档案 + 变更项 → `PUT /api/auth/profile` 请求体（后端字段为下划线风格） */
export function toProfileRequestBody(profile: UserProfile, changes: ProfileChangePayload) {
  return {
    user_id: profile.userId,
    username: profile.username,
    nickname: changes.nickname,
    role: profile.role,
    contact: changes.contact,
  }
}

/** `PUT /api/auth/password` 请求体；后端要求同时带上完整用户信息与 user_id */
export function toPasswordRequestBody(
  profile: UserProfile,
  oldPassword: string,
  newPassword: string,
) {
  return {
    old_password: oldPassword,
    new_password: newPassword,
    user_id: profile.userId,
    username: profile.username,
    nickname: profile.nickname,
    role: profile.role,
    contact: profile.contact,
  }
}

/** `POST /api/auth/logout` 请求体：后端按文档要求携带当前用户信息 */
export function toLogoutRequestBody(profile: UserProfile) {
  return {
    user_id: profile.userId,
    username: profile.username,
    nickname: profile.nickname,
    role: profile.role,
    contact: profile.contact,
  }
}

/**
 * 从登录响应体中找出 JWT。
 * 依次尝试：响应体自身即字符串 → 顶层 token 字段 → 嵌套一层对象（data/session/auth）→ 顶层直接携带 token 字段。
 */
export function findAuthToken(rawBody: unknown): string {
  const payload = readEnvelopeData(rawBody)
  const directToken = readTokenFromObject(payload)
  if (directToken) return directToken

  for (const nestedFieldName of ['data', 'session', 'auth']) {
    if (!isRecord(payload)) break
    const nestedToken = readTokenFromObject(payload[nestedFieldName])
    if (nestedToken) return nestedToken
  }

  // 少数实现把 token 与 code/msg 平级放在信封上
  return isRecord(rawBody) ? readTokenFromObject(rawBody) : ''
}

/** 从登录响应体里找出用户信息（取不到返回 null，由调用方再调档案接口） */
export function findUserProfile(rawBody: unknown): UserProfile | null {
  const payload = readEnvelopeData(rawBody)
  const inlineProfile = toUserProfileOrNull(payload)
  if (inlineProfile && inlineProfile.username) return inlineProfile
  if (!isRecord(payload)) return null

  for (const fieldName of userObjectFieldNames) {
    const nestedProfile = toUserProfileOrNull(payload[fieldName])
    if (nestedProfile && nestedProfile.username) return nestedProfile
  }

  return null
}

function readUserId(userRecord: Record<string, unknown>): number {
  for (const fieldName of userIdFieldNames) {
    const userId = toNumber(userRecord[fieldName])
    if (userId > 0) return userId
  }
  return 0
}

function readTokenFromObject(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!isRecord(value)) return ''
  for (const fieldName of authTokenFieldNames) {
    const token = toText(value[fieldName])
    if (token) return token
  }
  return ''
}
