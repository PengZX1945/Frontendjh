import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/http'
import {
  changeUserPassword,
  fetchUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
} from '@/api/user-api'
import type { ApiRequestOptions } from '@/types/api'
import type {
  LoginPayload,
  PasswordChangePayload,
  ProfileChangePayload,
  RegisterPayload,
  UserProfile,
} from '@/types/user'
import {
  clearStoredAuth,
  readStoredProfile,
  readStoredToken,
  saveStoredProfile,
  saveStoredToken,
} from '@/utils/auth-storage'

/**
 * 用户会话 store。
 * 凭证与档案都持久化到 localStorage，刷新页面后仍保持登录态；
 * 退出登录、凭证失效、改密成功统一走 `clearSession`。
 */
export const useUserStore = defineStore('user', () => {
  /** JWT 凭证；后端若改用 Cookie 会话则此处为空串，登录态由档案兜底判断 */
  const authToken = ref(readStoredToken())
  /** 当前登录用户档案 */
  const userProfile = ref<UserProfile | null>(readStoredProfile())

  const isLoggedIn = computed(() => authToken.value.length > 0 || userProfile.value !== null)

  const displayName = computed(
    () => userProfile.value?.nickname || userProfile.value?.username || '未登录',
  )

  /** 注册：成功后由页面引导至登录页 */
  async function signUp(payload: RegisterPayload, options: ApiRequestOptions = {}): Promise<void> {
    await registerUser(payload, options)
  }

  /** 登录：落库凭证，必要时补拉一次档案 */
  async function signIn(payload: LoginPayload, options: ApiRequestOptions = {}): Promise<void> {
    const session = await loginUser(payload, options)
    authToken.value = session.authToken
    saveStoredToken(session.authToken)

    if (session.userProfile) {
      setUserProfile(session.userProfile)
      return
    }

    // 接口文档把登录响应的 data 标注为 null，故再拉一次档案以确认会话可用
    try {
      await loadProfile(options)
    } catch {
      clearSession()
      throw session.authToken
        ? new ApiError('business', '登录成功，但获取用户信息失败，请稍后重试')
        : new ApiError('business', '登录响应未返回登录凭证（token），请确认后端登录接口的返回结构')
    }
  }

  /** 退出登录：后端调用失败也要保证本地能退出 */
  async function signOut(options: ApiRequestOptions = {}): Promise<void> {
    const currentUser = userProfile.value
    try {
      if (currentUser) await logoutUser(currentUser, { ...options, silent: true })
    } catch {
      // 以本地清理为准，忽略后端异常
    } finally {
      clearSession()
    }
  }

  /** 拉取（或刷新）当前用户档案 */
  async function loadProfile(options: ApiRequestOptions = {}): Promise<UserProfile> {
    const profile = await fetchUserProfile(options)
    setUserProfile(profile)
    return profile
  }

  /** 保存昵称与联系方式的修改 */
  async function saveProfileChanges(
    changes: ProfileChangePayload,
    options: ApiRequestOptions = {},
  ): Promise<void> {
    const currentUser = requireUserProfile()
    await updateUserProfile(currentUser, changes, options)
    setUserProfile({ ...currentUser, nickname: changes.nickname, contact: changes.contact })
  }

  /** 修改密码：后端要求改密后重新登录，成功后本地凭证一并作废 */
  async function saveNewPassword(
    payload: PasswordChangePayload,
    options: ApiRequestOptions = {},
  ): Promise<void> {
    const currentUser = requireUserProfile()
    await changeUserPassword(currentUser, payload, options)
    clearSession()
  }

  /** 清空登录态（退出登录、凭证失效、改密成功共用） */
  function clearSession(): void {
    authToken.value = ''
    userProfile.value = null
    clearStoredAuth()
  }

  function setUserProfile(profile: UserProfile): void {
    userProfile.value = profile
    saveStoredProfile(profile)
  }

  function requireUserProfile(): UserProfile {
    if (!userProfile.value) {
      throw new ApiError('business', '尚未获取到用户信息，请重新登录后重试')
    }
    return userProfile.value
  }

  return {
    authToken,
    userProfile,
    isLoggedIn,
    displayName,
    signUp,
    signIn,
    signOut,
    loadProfile,
    saveProfileChanges,
    saveNewPassword,
    clearSession,
  }
})
