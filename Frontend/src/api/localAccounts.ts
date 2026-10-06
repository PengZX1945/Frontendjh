/**
 * 本地调试账号：后端 /api 还没接入时，用它们登录先把前端流程跑通。
 *
 * 只用于本地联调：Userlogin.vue 里的 USE_LOCAL_LOGIN 改成 false 后，
 * 登录就改走后端 /auth/login，这里的账号便不再生效。
 */
import { ErrorCode } from './errorCode'
import type { AuthResult } from './request'

/** 账号角色：普通用户 / 管理员 */
export type UserRole = 'user' | 'admin'

/** 角色中文名，页面上展示用 */
export const ROLE_LABEL: Record<UserRole, string> = {
  user: '普通用户',
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
}

/** 内置的本地账号：一个默认用户 + 一个管理员 */
export const LOCAL_ACCOUNTS: readonly LocalAccount[] = [
  { username: 'testuser', password: '123456', role: 'user', nickname: '默认用户' },
  { username: 'admin', password: 'admin123', role: 'admin', nickname: '管理员' },
]

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

  const account = LOCAL_ACCOUNTS.find(
    (item) => item.username === username && item.password === password,
  )

  if (!account) {
    return { code: ErrorCode.LOGIN_FAILED, msg: '用户名或密码错误' }
  }

  return {
    code: ErrorCode.SUCCESS,
    msg: 'success',
    data: {
      token: `local-token-${account.username}`,
      username: account.username,
      nickname: account.nickname,
      role: account.role,
    },
  }
}
