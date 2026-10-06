import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { resolveRole, type UserRole } from '../api/localAccounts'

/** 登录凭证的存储键，和 api/request.js 的请求拦截器保持一致 */
const TOKEN_KEY = 'token'
/** 当前登录用户名的存储键 */
const USERNAME_KEY = 'current_user'
/** 当前登录用户角色的存储键 */
const ROLE_KEY = 'role'
/** 当前登录用户昵称的存储键 */
const NICKNAME_KEY = 'nickname'
/** 当前登录用户电话的存储键 */
const CONTACT_KEY = 'contact'
/** 当前登录用户 ID 的存储键：1.5 / 1.6 的 user_id 取自这里 */
const USER_ID_KEY = 'user_id'
/** 「记住我」保存的账号，只用于登录页回填，退出登录时不清除 */
const REMEMBERED_USERNAME_KEY = 'login_user'

const STORAGES = [localStorage, sessionStorage]

function readFromStorages(key: string): string {
  return STORAGES.map((storage) => storage.getItem(key)).find((value) => value) ?? ''
}

function removeFromStorages(key: string): void {
  STORAGES.forEach((storage) => storage.removeItem(key))
}

/** 登录态可能存在 localStorage 也可能在 sessionStorage，按 token 判断当前用的是哪个 */
function activeStorage(): Storage {
  return localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage
}

export interface AuthPayload {
  token: string
  username: string
  remember?: boolean
  /** 账号角色，不传按普通用户处理 */
  role?: UserRole
  /** 昵称，登录接口返回时一并存入 */
  nickname?: string
  /** 联系电话，登录接口返回时一并存入 */
  contact?: string
  /** 用户 ID，登录接口返回时一并存入；接口 1.4 也会补上 */
  id?: number
}

export const useUserStore = defineStore('user', () => {
  // 初始化时从 storage 恢复登录态，实现刷新 / 重开页面后仍保持登录
  const token = ref(readFromStorages(TOKEN_KEY))
  const username = ref(readFromStorages(USERNAME_KEY))
  // 刷新后角色同样从 storage 恢复，管理员身份才不会丢
  const role = ref<UserRole>(resolveRole(readFromStorages(ROLE_KEY)))
  const nickname = ref(readFromStorages(NICKNAME_KEY))
  const contact = ref(readFromStorages(CONTACT_KEY))
  const userId = ref(Number(readFromStorages(USER_ID_KEY)) || 0)
  const remember = ref(Boolean(localStorage.getItem(TOKEN_KEY)))

  const isLoggedIn = computed(() => Boolean(token.value))
  const isAdmin = computed(() => role.value === 'admin')

  /** 登录成功后写入登录态，并按「记住我」决定存到哪个 storage */
  function setAuth({
    token: nextToken,
    username: nextUsername,
    remember: nextRemember = false,
    role: nextRole = 'user',
    nickname: nextNickname = '',
    contact: nextContact = '',
    id: nextId = 0,
  }: AuthPayload): void {
    token.value = nextToken
    username.value = nextUsername
    remember.value = nextRemember
    role.value = nextRole
    nickname.value = nextNickname
    contact.value = nextContact
    userId.value = nextId

    // 先清掉 storage 里的旧值，避免上次「记住我」的残留覆盖本次选择
    removeFromStorages(TOKEN_KEY)
    removeFromStorages(USERNAME_KEY)
    removeFromStorages(ROLE_KEY)
    removeFromStorages(NICKNAME_KEY)
    removeFromStorages(CONTACT_KEY)
    removeFromStorages(USER_ID_KEY)

    const storage = nextRemember ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, nextToken)
    storage.setItem(USERNAME_KEY, nextUsername)
    storage.setItem(ROLE_KEY, nextRole)
    storage.setItem(NICKNAME_KEY, nextNickname)
    storage.setItem(CONTACT_KEY, nextContact)
    storage.setItem(USER_ID_KEY, String(nextId))

    if (nextRemember) {
      localStorage.setItem(REMEMBERED_USERNAME_KEY, nextUsername)
    } else {
      localStorage.removeItem(REMEMBERED_USERNAME_KEY)
    }
  }

  /** 保存个人信息：昵称 / 电话写回当前登录态所在的 storage */
  function setProfile(nextNickname: string, nextContact: string): void {
    nickname.value = nextNickname
    contact.value = nextContact

    const storage = activeStorage()
    storage.setItem(NICKNAME_KEY, nextNickname)
    storage.setItem(CONTACT_KEY, nextContact)
  }

  /** 记录用户 ID：接口 1.4 返回后写入，供 1.5 / 1.6 的 user_id 使用 */
  function setUserId(nextId: number): void {
    userId.value = nextId
    activeStorage().setItem(USER_ID_KEY, String(nextId))
  }

  /** 退出登录 / 登录态失效：清空内存状态和两个 storage 里的凭证 */
  function logout(): void {
    token.value = ''
    username.value = ''
    remember.value = false
    role.value = 'user'
    nickname.value = ''
    contact.value = ''
    userId.value = 0

    removeFromStorages(TOKEN_KEY)
    removeFromStorages(USERNAME_KEY)
    removeFromStorages(ROLE_KEY)
    removeFromStorages(NICKNAME_KEY)
    removeFromStorages(CONTACT_KEY)
    removeFromStorages(USER_ID_KEY)
  }

  /** 登录页回填账号：没有注册页带来的 query 时，就用「记住我」存下的账号 */
  function getRememberedUsername(): string {
    return localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? ''
  }

  return {
    token,
    username,
    role,
    nickname,
    contact,
    userId,
    remember,
    isLoggedIn,
    isAdmin,
    setAuth,
    setProfile,
    setUserId,
    logout,
    getRememberedUsername,
  }
})
