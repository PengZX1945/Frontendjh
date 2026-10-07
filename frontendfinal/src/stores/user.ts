import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  changeUserPassword,
  fetchUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
} from '@/api/auth-api'
import { ApiError } from '@/api/api-error'
import {
  clearAuthStorage,
  readAuthToken,
  readStoredProfile,
  writeAuthToken,
  writeStoredProfile,
} from '@/utils/auth-storage'
import { isBackOfficeRole, isSystemAdminRole } from '@/utils/user-role'
import type { ApiRequestOptions } from '@/types/api'
import type {
  LoginPayload,
  LoginSession,
  PasswordChangePayload,
  ProfileChangePayload,
  RegisterPayload,
  UserProfile,
} from '@/types/user'

/** 后端既没给凭证、也拿不到档案时的显式提示，避免「登录成功却什么都没发生」 */
export const loginCredentialMissingMessage =
  '登录响应未返回登录凭证，请联系后端确认凭证字段或会话方式'

/**
 * 会话 store：凭证与档案的唯一持有者。
 *
 * 数据流只有一条 —— 页面 → store → api → 后端。
 * 页面不直接调用 axios，也不直接读写 localStorage。
 */
export const useUserStore = defineStore('user', () => {
  const authToken = ref(readAuthToken())
  const userProfile = ref<UserProfile | null>(readStoredProfile())

  /** 有凭证或已有档案即视为已登录（兼容后端改用 Cookie 会话的实现） */
  const isLoggedIn = computed(() => authToken.value !== '' || userProfile.value !== null)

  const role = computed(() => userProfile.value?.role ?? 'user')
  const isBackOffice = computed(() => isBackOfficeRole(role.value))
  const isSystemAdmin = computed(() => isSystemAdminRole(role.value))
  const displayName = computed(() => {
    const profile = userProfile.value
    if (profile === null) return isLoggedIn.value ? '我的账号' : '未登录'
    return profile.nickname || profile.username
  })
  const currentUserId = computed(() => userProfile.value?.userId ?? 0)

  function persist(): void {
    writeAuthToken(authToken.value)
    writeStoredProfile(userProfile.value)
  }

  /** 清空本地会话（不调后端） */
  function clearSession(): void {
    authToken.value = ''
    userProfile.value = null
    clearAuthStorage()
  }

  /**
   * 登录后补齐档案。
   * 文档把登录响应的 `data` 标为 `{ token }`，没承诺带用户信息，
   * 因此拿不到时就再请求一次 `GET /auth/profile`。
   */
  async function establishProfile(session: LoginSession): Promise<UserProfile> {
    if (session.userProfile !== null) return session.userProfile
    try {
      return await fetchUserProfile({ silent: true })
    } catch (error) {
      if (session.authToken === '') {
        throw new ApiError({ kind: 'business', message: loginCredentialMissingMessage })
      }
      throw error
    }
  }

  /**
   * 登录。失败时抛 `ApiError`，由登录页内联展示（对应 `silent: true`）。
   *
   * 关键顺序：拿到凭证后**先落盘再取档案** —— 后续请求的 `Authorization`
   * 由请求层从 localStorage 读取注入，若不先写入，取档案那一步会变成匿名请求而拿到 401。
   */
  async function signIn(payload: LoginPayload): Promise<void> {
    const session = await loginUser(payload, { silent: true })
    authToken.value = session.authToken
    writeAuthToken(authToken.value)
    try {
      userProfile.value = await establishProfile(session)
    } catch (error) {
      // 凭证没能换来档案，说明这次登录并未真正建立会话，回滚避免留下半登录状态
      clearSession()
      throw error
    }
    persist()
  }

  /** 注册。注册成功后由登录页引导去登录（后端注册接口不返回凭证） */
  async function signUp(payload: RegisterPayload): Promise<void> {
    await registerUser(payload, { silent: true })
  }

  /**
   * 退出登录。
   * 后端调用失败也要退出成功 —— 清理本地状态放在 `finally` 里。
   */
  async function signOut(): Promise<void> {
    try {
      await logoutUser({ silent: true })
    } finally {
      clearSession()
    }
  }

  /** 重新拉取档案（刷新页面、或修改资料后） */
  async function refreshProfile(options: ApiRequestOptions = {}): Promise<UserProfile | null> {
    const profile = await fetchUserProfile(options)
    userProfile.value = profile
    persist()
    return profile
  }

  /** 修改昵称与联系方式 */
  async function saveProfile(payload: ProfileChangePayload): Promise<void> {
    await updateUserProfile(currentUserId.value, payload, { silent: true })
    await refreshProfile({ silent: true })
  }

  /**
   * 修改密码。
   * 与后端约定一致：改密成功后本地凭证立即作废，回到登录页重新登录。
   */
  async function savePassword(payload: PasswordChangePayload): Promise<void> {
    await changeUserPassword(currentUserId.value, payload, { silent: true })
    clearSession()
  }

  return {
    authToken,
    userProfile,
    isLoggedIn,
    role,
    isBackOffice,
    isSystemAdmin,
    displayName,
    currentUserId,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    saveProfile,
    savePassword,
    clearSession,
  }
})
