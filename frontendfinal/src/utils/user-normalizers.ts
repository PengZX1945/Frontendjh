import type { LoginSession, UserProfile, UserRole } from '@/types/user'
import {
  isRecord,
  pickRecord,
  pickText,
  readEnvelopeData,
  toNumber,
  toText,
} from '@/utils/type-guards'

/**
 * 登录凭证的候选字段名。
 *
 * 接口文档把 `POST /auth/login` 的 `data` 标成 `{ token }`，但后端定稿前不宜把
 * 字段名写死 —— 命中顺序：响应体 → 响应体的嵌套容器 → 响应头。
 * 后端定稿后若只需保留一个字段，改这个数组即可。
 */
const authTokenBodyKeys = [
  'token',
  'access_token',
  'accessToken',
  'jwt',
  'authorization',
  'auth_token',
] as const

const authTokenHeaderKeys = ['authorization', 'x-token', 'x-auth-token', 'token'] as const

/** 登录响应里可能内联用户信息的容器键 */
const profileContainerKeys = [
  'user',
  'userInfo',
  'user_info',
  'profile',
  'session',
  'auth',
  'data',
] as const

/** 角色收敛：未知值一律回落为普通用户，避免权限判断被脏数据放大 */
export function normalizeUserRole(value: unknown): UserRole {
  const text = toText(value)
  if (text === 'finder_admin' || text === 'sys_admin' || text === 'user') return text
  return 'user'
}

/** 归一化用户档案（下划线字段 → 小驼峰模型） */
export function normalizeUserProfile(raw: unknown): UserProfile {
  const record = isRecord(raw) ? raw : {}
  return {
    userId: toNumber(record.userId ?? record.user_id ?? record.id),
    username: toText(record.username),
    nickname: toText(record.nickname),
    role: normalizeUserRole(record.role),
    contact: toText(record.contact),
  }
}

/** 逐层找「含 username 的那一层对象」；层数上限与检索纪律一致，不做无边界递归 */
function findProfileRecord(value: unknown, depth: number): Record<string, unknown> | null {
  if (depth > 3 || !isRecord(value)) return null
  if (pickText(value, ['username']) !== '') return value

  for (const key of profileContainerKeys) {
    const found = findProfileRecord(value[key], depth + 1)
    if (found !== null) return found
  }
  return null
}

/**
 * 从登录响应里挑出用户档案。
 * 若响应只给了凭证、没给档案，返回 null，由调用方再拉一次 `GET /auth/profile`。
 */
export function extractProfileFromLoginBody(rawBody: unknown): UserProfile | null {
  const found = findProfileRecord(readEnvelopeData(rawBody), 1)
  return found === null ? null : normalizeUserProfile(found)
}

/**
 * 探测登录凭证。
 *
 * 依次尝试：响应体顶层 → 响应体 `data` → 响应体其他嵌套容器 → 响应头。
 * 全部落空返回空串，调用方按 Cookie 会话兜底（再拉一次 profile 验证）。
 */
export function extractAuthToken(rawBody: unknown, responseHeaders?: unknown): string {
  const body = isRecord(rawBody) ? rawBody : {}

  const directToken = pickText(body, authTokenBodyKeys)
  if (directToken !== '') return directToken

  const dataContainer = body.data
  if (isRecord(dataContainer)) {
    const dataToken = pickText(dataContainer, authTokenBodyKeys)
    if (dataToken !== '') return dataToken
  }

  const nestedContainer = pickRecord(body, profileContainerKeys)
  if (nestedContainer !== null) {
    const nestedToken = pickText(nestedContainer, authTokenBodyKeys)
    if (nestedToken !== '') return nestedToken
  }

  if (isRecord(responseHeaders)) {
    const headerToken = pickText(responseHeaders, authTokenHeaderKeys)
    if (headerToken !== '') {
      // 有些实现回传 `Bearer xxx`，剥掉前缀只留凭证本体
      return headerToken.replace(/^Bearer\s+/i, '')
    }
  }

  return ''
}

/** 组装一次登录的会话结果 */
export function buildLoginSession(rawBody: unknown, responseHeaders?: unknown): LoginSession {
  return {
    authToken: extractAuthToken(rawBody, responseHeaders),
    userProfile: extractProfileFromLoginBody(rawBody),
  }
}
