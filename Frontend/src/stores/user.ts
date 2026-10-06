import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { resolveRole, type UserRole } from '../api/localAccounts'

/** 登录凭证的存储键，和 api/request.js 的请求拦截器保持一致 */
const TOKEN_KEY = 'token'
/** 当前登录用户名的存储键 */
const USERNAME_KEY = 'current_user'
/** 当前登录用户角色的存储键 */
const ROLE_KEY = 'role'
/** 「记住我」保存的账号，只用于登录页回填，退出登录时不清除 */
const REMEMBERED_USERNAME_KEY = 'login_user'

/** 勾选「记住我」写 localStorage（关浏览器仍保留），否则写 sessionStorage（关浏览器即失效） */
const STORAGES = [localStorage, sessionStorage]

function readFromStorages(key: string): string {
  return STORAGES.map((storage) => storage.getItem(key)).find((value) => value) ?? ''
}

function removeFromStorages(key: string): void {
  STORAGES.forEach((storage) => storage.removeItem(key))
}

export interface AuthPayload {
  token: string
  username: string
  remember?: boolean
  /** 账号角色，不传按普通用户处理 */
  role?: UserRole
}

export const useUserStore = defineStore('user', () => {
  // 初始化时从 storage 恢复登录态，实现刷新 / 重开页面后仍保持登录
  const token = ref(readFromStorages(TOKEN_KEY))
  const username = ref(readFromStorages(USERNAME_KEY))
  // 刷新后角色同样从 storage 恢复，管理员身份才不会丢
  const role = ref<UserRole>(resolveRole(readFromStorages(ROLE_KEY)))
  const remember = ref(Boolean(localStorage.getItem(TOKEN_KEY)))

  const isLoggedIn = computed(() => Boolean(token.value))
  const isAdmin = computed(() => role.value === 'admin')

  /** 登录成功后写入登录态，并按「记住我」决定存到哪个 storage */
  function setAuth({
    token: nextToken,
    username: nextUsername,
    remember: nextRemember = false,
    role: nextRole = 'user',
  }: AuthPayload): void {
    token.value = nextToken
    username.value = nextUsername
    remember.value = nextRemember
    role.value = nextRole

    // 先清掉两个 storage 里的旧值，避免上次「记住我」的残留覆盖本次选择
    removeFromStorages(TOKEN_KEY)
    removeFromStorages(USERNAME_KEY)
    removeFromStorages(ROLE_KEY)

    const storage = nextRemember ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, nextToken)
    storage.setItem(USERNAME_KEY, nextUsername)
    storage.setItem(ROLE_KEY, nextRole)

    if (nextRemember) {
      localStorage.setItem(REMEMBERED_USERNAME_KEY, nextUsername)
    } else {
      localStorage.removeItem(REMEMBERED_USERNAME_KEY)
    }
  }

  /** 退出登录 / 登录态失效：清空内存状态和两个 storage 里的凭证 */
  function logout(): void {
    token.value = ''
    username.value = ''
    remember.value = false
    role.value = 'user'

    removeFromStorages(TOKEN_KEY)
    removeFromStorages(USERNAME_KEY)
    removeFromStorages(ROLE_KEY)
  }

  /** 登录页回填账号：没有注册页带来的 query 时，就用「记住我」存下的账号 */
  function getRememberedUsername(): string {
    return localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? ''
  }

  return {
    token,
    username,
    role,
    remember,
    isLoggedIn,
    isAdmin,
    setAuth,
    logout,
    getRememberedUsername,
  }
})
