/**
 * 账号角色与角色文案。
 * 联调真实后端后，角色来自 GET /api/auth/profile 的 role 字段：
 * user / finder_admin / sys_admin；本地调试账号（USE_LOCAL_LOGIN）使用 admin。
 */
import { ErrorCode } from './errorCode'
import type { AuthResult } from './request'

/** 账号角色：普通用户 / 管理员（本地调试用 admin，后端为 finder_admin / sys_admin） */
export type UserRole = 'user' | 'finder_admin' | 'sys_admin' | 'admin'

/** 角色中文名，页面上展示用 */
export const ROLE_LABEL: Record<UserRole, string> = {
  user: '用户',
  admin: '管理员',
  finder_admin: '寻物管理员',
  sys_admin: '系统管理员',
}

export interface LocalAccount {
  username: string
  password: string
  role: UserRole
  nickname: string
}

/** 内置的本地账号：一个默认用户 + 一个管理员 */
export const LOCAL_ACCOUNTS: readonly LocalAccount[] = [
  { username: 'testuser', password: '123456', role: 'user', nickname: '用户user' },
  { username: 'admin', password: 'admin123', role: 'admin', nickname: '管理员' },
]

/** 模拟网络耗时，让按钮的 loading 状态可见 */
const LOCAL_DELAY = 1000

/** 从后端 / 本地登录返回的 role 里取角色；非法或取不到按普通用户处理 */
export function resolveRole(raw: unknown): UserRole {
  if (raw === 'finder_admin' || raw === 'sys_admin' || raw === 'admin') return raw
  return 'user'
}

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
