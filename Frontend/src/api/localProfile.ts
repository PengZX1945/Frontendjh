/**
 * 个人信息的本地兜底：昵称 / 联系方式按账号存在 localStorage，
 * 密码改动记到 localAccounts 的 writeLocalPassword 里，保证改完能用新密码登录。
 *
 * 账号身份和真实接口一样「从 auth 传入」：优先用 query 里的 userId，
 * 取不到（比如刷新后参数丢了）就回落到 token 里的用户名。
 */
import { ErrorCode } from './errorCode'
import {
  LOCAL_ACCOUNTS,
  LOCAL_TOKEN_PREFIX,
  localAccountById,
  readLocalPassword,
  writeLocalPassword,
  type LocalAccount,
} from './localAccounts'
import type { ApiResponse } from './apiTypes'
import type { UpdateProfilePayload, UserProfile } from './profileMeta'

/** 模拟网络耗时，让弹窗的 loading 状态可见 */
const LOCAL_DELAY = 400

const profileKey = (username: string): string => `local_profile_${username}`

interface StoredProfile {
  nickname?: string
  contact?: string
}

function readStored(username: string): StoredProfile {
  try {
    return JSON.parse(localStorage.getItem(profileKey(username)) ?? '{}') as StoredProfile
  } catch {
    return {}
  }
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LOCAL_DELAY))
}

/** 从本地登录 token（local-token-<username>）反查当前账号 */
function accountFromToken(): LocalAccount | undefined {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? ''
  if (!token.startsWith(LOCAL_TOKEN_PREFIX)) return undefined

  const username = token.slice(LOCAL_TOKEN_PREFIX.length)
  return LOCAL_ACCOUNTS.find((item) => item.username === username)
}

/** 定位账号：先按 userId，取不到再用 token 里的用户名 */
function resolveAccount(userId?: number): LocalAccount | undefined {
  return (userId ? localAccountById(userId) : undefined) ?? accountFromToken()
}

/** 拼出 profile 结构：改过的值优先，其次是内置账号的初始值 */
function toProfile(account: LocalAccount, userId: number): UserProfile {
  const stored = readStored(account.username)

  return {
    id: userId,
    username: account.username,
    nickname: stored.nickname ?? account.nickname,
    contact: stored.contact ?? account.contact,
    role: account.role,
  }
}

/** 1.4 本地读取个人信息 */
export async function localFetchProfile(): Promise<ApiResponse<UserProfile>> {
  await delay()

  const account = accountFromToken()
  if (!account) {
    return { code: ErrorCode.UNAUTHORIZED, msg: '未登录或登录已过期', data: null }
  }

  return {
    code: ErrorCode.SUCCESS,
    msg: 'success',
    data: toProfile(account, LOCAL_ACCOUNTS.indexOf(account) + 1),
  }
}

/** 1.5 本地保存昵称 / 联系方式，成功时 data 为 null（与接口一致） */
export async function localUpdateProfile(
  userId: number,
  payload: UpdateProfilePayload,
): Promise<ApiResponse<null>> {
  await delay()

  const account = resolveAccount(userId)
  if (!account) {
    return { code: ErrorCode.UNAUTHORIZED, msg: '未登录或登录已过期', data: null }
  }

  localStorage.setItem(profileKey(account.username), JSON.stringify(payload))
  return { code: ErrorCode.SUCCESS, msg: 'success', data: null }
}

/** 1.6 本地改密码：原密码不对返回 10006，和后端约定一致 */
export async function localChangePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
): Promise<ApiResponse<null>> {
  await delay()

  const account = resolveAccount(userId)
  if (!account) {
    return { code: ErrorCode.UNAUTHORIZED, msg: '未登录或登录已过期', data: null }
  }

  if (oldPassword !== readLocalPassword(account.username)) {
    return { code: ErrorCode.LOGIN_FAILED, msg: '原密码错误', data: null }
  }

  writeLocalPassword(account.username, newPassword)
  return { code: ErrorCode.SUCCESS, msg: 'success', data: null }
}
