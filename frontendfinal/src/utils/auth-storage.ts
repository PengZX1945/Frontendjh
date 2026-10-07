import { authTokenStorageKey, userProfileStorageKey } from '@/utils/storage-keys'
import { isRecord } from '@/utils/type-guards'
import type { UserProfile, UserRole } from '@/types/user'

/**
 * 读取本地凭证。
 * localStorage 在隐私模式或被禁用时会抛异常，因此全部包一层 try。
 */
export function readAuthToken(): string {
  try {
    return window.localStorage.getItem(authTokenStorageKey) ?? ''
  } catch {
    return ''
  }
}

export function readStoredProfile(): UserProfile | null {
  try {
    const raw = window.localStorage.getItem(userProfileStorageKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    return {
      userId: typeof parsed.userId === 'number' ? parsed.userId : 0,
      username: typeof parsed.username === 'string' ? parsed.username : '',
      nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
      role: (typeof parsed.role === 'string' ? parsed.role : 'user') as UserRole,
      contact: typeof parsed.contact === 'string' ? parsed.contact : '',
    }
  } catch {
    return null
  }
}

export function writeAuthToken(authToken: string): void {
  try {
    if (authToken === '') window.localStorage.removeItem(authTokenStorageKey)
    else window.localStorage.setItem(authTokenStorageKey, authToken)
  } catch {
    /* 存储不可用时静默降级：本次会话仍可继续，只是刷新后掉线 */
  }
}

export function writeStoredProfile(userProfile: UserProfile | null): void {
  try {
    if (userProfile === null) window.localStorage.removeItem(userProfileStorageKey)
    else window.localStorage.setItem(userProfileStorageKey, JSON.stringify(userProfile))
  } catch {
    /* 同上 */
  }
}

export function clearAuthStorage(): void {
  try {
    window.localStorage.removeItem(authTokenStorageKey)
    window.localStorage.removeItem(userProfileStorageKey)
  } catch {
    /* 同上 */
  }
}
