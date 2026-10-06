/**
 * 本地调试账号：后端 /api 还没接入时，用它们登录先把前端流程跑通。
 *
 * 只用于本地联调：Userlogin.vue 里的 USE_LOCAL_LOGIN 改成 false 后，
 * 登录就改走后端 /auth/login，这里的账号便不再生效。
 */
import { ErrorCode } from './errorCode'
import type { AuthResult } from './request'

/** 账号角色：用户 / 管理员 */
export type UserRole = 'user' | 'admin'

/** 角色中文名，页面上展示用 */
export const ROLE_LABEL: Record<UserRole, string> = {
  user: '用户',
  admin: '管理员',
}

export interface LocalAccount {
  /** 登录账号 */
  username: string
  /** 登录密码 */
  password: string
  /** 角色，后续做权限控制时用 */
  role: UserRole
  /** 展示用昵称 */
  nickname: string
  /** 联系电话，对应 /auth/profile 的 contact */
  contact: string
}

/** 内置的本地账号：一个默认用户 + 一个管理员 */
export const LOCAL_ACCOUNTS: readonly LocalAccount[] = [
  { username: 'testuser', password: '12345678', role: 'user', nickname: '用户user', contact: '13800001111' },
  { username: 'admin', password: 'admin123', role: 'admin', nickname: '管理员', contact: '13900002222' },
]

/** 改过密码的本地账号，密码存这里，覆盖 LOCAL_ACCOUNTS 里的初始密码 */
const localPasswordKey = (username: string): string => `local_password_${username}`

/** 本地登录 token 的前缀，形如 local-token-<username> */
export const LOCAL_TOKEN_PREFIX = 'local-token-'

/** 本地账号 id：用数组下标 + 1 模拟后端的自增主键，和 profile 接口返回的 id 对应 */
export function localAccountById(userId: number): LocalAccount | undefined {
  return LOCAL_ACCOUNTS[userId - 1]
}

/** 取账号当前生效的密码：改过就用改后的，没改过用内置的 */
export function readLocalPassword(username: string): string {
  const account = LOCAL_ACCOUNTS.find((item) => item.username === username)
  return localStorage.getItem(localPasswordKey(username)) ?? account?.password ?? ''
}

/** 记录改后的密码，让「修改密码 → 重新登录」这条流程在本地也走得通 */
export function writeLocalPassword(username: string, password: string): void {
  localStorage.setItem(localPasswordKey(username), password)
}

/** 模拟网络耗时，让按钮的 loading 状态可见 */
const LOCAL_DELAY = 1000

/** 从登录返回的 data 里取角色，取不到或非法时按普通用户处理 */
export function resolveRole(raw: unknown): UserRole {
  return raw === 'admin' ? 'admin' : 'user'
}

/**
 * 本地登录：不请求后端，直接用 LOCAL_ACCOUNTS 校验账号密码。
 * 返回结构和后端 /auth/login 保持一致，方便随时切回真实接口。
 */
export async function localLogin(payload: {
  username: string
  password: string
}): Promise<AuthResult> {
  const { username, password } = payload
  await new Promise((resolve) => setTimeout(resolve, LOCAL_DELAY))

  const account = LOCAL_ACCOUNTS.find((item) => item.username === username)

  // 密码用「当前生效」的那个，改过密码的账号才能用新密码登录
  if (!account || readLocalPassword(username) !== password) {
    return { code: ErrorCode.LOGIN_FAILED, msg: '用户名或密码错误' }
  }

  return {
    code: ErrorCode.SUCCESS,
    msg: 'success',
    data: {
      token: `${LOCAL_TOKEN_PREFIX}${account.username}`,
      username: account.username,
      nickname: account.nickname,
      contact: account.contact,
      role: account.role,
    },
  }
}
