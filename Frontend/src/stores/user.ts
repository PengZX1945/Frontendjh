import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/** 登录凭证的存储键，和 api/request.js 的请求拦截器保持一致 */
const TOKEN_KEY = 'token'
/** 当前登录用户名的存储键 */
const USERNAME_KEY = 'current_user'
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
}

export const useUserStore = defineStore('user', () => {
  // 初始化时从 storage 恢复登录态，实现刷新 / 重开页面后仍保持登录
  const token = ref(readFromStorages(TOKEN_KEY))
  const username = ref(readFromStorages(USERNAME_KEY))
  const remember = ref(Boolean(localStorage.getItem(TOKEN_KEY)))

  const isLoggedIn = computed(() => Boolean(token.value))

  /** 登录成功后写入登录态，并按「记住我」决定存到哪个 storage */
  function setAuth({
    token: nextToken,
    username: nextUsername,
    remember: nextRemember = false,
  }: AuthPayload): void {
    token.value = nextToken
    username.value = nextUsername
    remember.value = nextRemember

    // 先清掉两个 storage 里的旧值，避免上次「记住我」的残留覆盖本次选择
    removeFromStorages(TOKEN_KEY)
    removeFromStorages(USERNAME_KEY)

    const storage = nextRemember ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, nextToken)
    storage.setItem(USERNAME_KEY, nextUsername)

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

    removeFromStorages(TOKEN_KEY)
    removeFromStorages(USERNAME_KEY)
  }

  /** 登录页回填账号：没有注册页带来的 query 时，就用「记住我」存下的账号 */
  function getRememberedUsername(): string {
    return localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? ''
  }

  return { token, username, remember, isLoggedIn, setAuth, logout, getRememberedUsername }
})
