import type { UserProfile } from '@/types/user'
import { toUserProfileOrNull } from '@/utils/user-normalizers'
import { authTokenStorageKey, userProfileStorageKey } from '@/utils/storage-keys'

/**
 * 鉴权信息的本地持久化。
 * 刷新页面后仍能保持登录态；读写集中在此，避免各处直接操作 localStorage 造成键名漂移。
 */

/** 读取本地 JWT；不存在或已被清空时返回空串 */
export function readStoredToken(): string {
  const storedToken = localStorage.getItem(authTokenStorageKey)
  return storedToken ?? ''
}

export function saveStoredToken(authToken: string): void {
  if (authToken) localStorage.setItem(authTokenStorageKey, authToken)
  else localStorage.removeItem(authTokenStorageKey)
}

/** 读取本地缓存的用户档案；内容损坏时清理并返回 null */
export function readStoredProfile(): UserProfile | null {
  const storedProfile = localStorage.getItem(userProfileStorageKey)
  if (!storedProfile) return null
  try {
    return toUserProfileOrNull(JSON.parse(storedProfile))
  } catch {
    localStorage.removeItem(userProfileStorageKey)
    return null
  }
}

export function saveStoredProfile(userProfile: UserProfile): void {
  localStorage.setItem(userProfileStorageKey, JSON.stringify(userProfile))
}

/** 清空全部本地鉴权信息（退出登录、凭证失效、改密后强制重新登录共用） */
export function clearStoredAuth(): void {
  localStorage.removeItem(authTokenStorageKey)
  localStorage.removeItem(userProfileStorageKey)
}
