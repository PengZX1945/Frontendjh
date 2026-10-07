import { sendRequest, request } from '@/api/http'
import {
  buildLoginSession,
  normalizeUserProfile,
  normalizeUserRole,
} from '@/utils/user-normalizers'
import { isRecord, readRecordList, toNumber, toText } from '@/utils/type-guards'
import type { ApiRequestOptions } from '@/types/api'
import type {
  LoginPayload,
  LoginSession,
  ManagedUser,
  PasswordChangePayload,
  ProfileChangePayload,
  RegisterPayload,
  UserProfile,
  UserRole,
} from '@/types/user'

/** `POST /api/auth/register` — 注册（公开接口） */
export async function registerUser(
  payload: RegisterPayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'post',
    url: '/auth/register',
    data: payload,
    skipAuth: true,
    ...options,
  })
}

/**
 * `POST /api/auth/login` — 登录（公开接口）。
 * 用 `sendRequest` 拿完整响应，以便在响应体/响应头里探测凭证。
 */
export async function loginUser(
  payload: LoginPayload,
  options: ApiRequestOptions = {},
): Promise<LoginSession> {
  const rawResponse = await sendRequest({
    method: 'post',
    url: '/auth/login',
    data: payload,
    skipAuth: true,
    ...options,
  })
  return buildLoginSession(rawResponse.body, rawResponse.headers)
}

/** `POST /api/auth/logout` — 退出登录 */
export async function logoutUser(options: ApiRequestOptions = {}): Promise<void> {
  await request<void>({ method: 'post', url: '/auth/logout', ...options })
}

/** `GET /api/auth/profile` — 获取当前登录用户档案 */
export async function fetchUserProfile(options: ApiRequestOptions = {}): Promise<UserProfile> {
  const rawProfile = await request<unknown>({ method: 'get', url: '/auth/profile', ...options })
  return normalizeUserProfile(rawProfile)
}

/** `PUT /api/auth/profile?user_id=` — 修改昵称与联系方式（用户名与角色不可改） */
export async function updateUserProfile(
  userId: number,
  payload: ProfileChangePayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: '/auth/profile',
    params: { user_id: userId },
    data: payload,
    ...options,
  })
}

/** `PUT /api/auth/password?user_id=` — 修改密码（成功后本地凭证作废） */
export async function changeUserPassword(
  userId: number,
  payload: PasswordChangePayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: '/auth/password',
    params: { user_id: userId },
    data: { old_password: payload.oldPassword, new_password: payload.newPassword },
    ...options,
  })
}

/** `GET /api/admin/users` — 用户列表（系统管理员） */
export async function fetchManagedUsers(
  params: { keyword?: string; role?: UserRole; page?: number; pageSize?: number } = {},
  options: ApiRequestOptions = {},
): Promise<{ records: ManagedUser[]; hasMore: boolean }> {
  const rawBody = await sendRequest({
    method: 'get',
    url: '/admin/users',
    params: {
      keyword: params.keyword || undefined,
      role: params.role || undefined,
      page: params.page,
      page_size: params.pageSize,
    },
    ...options,
  })

  const records = readRecordList(rawBody.body, ['users']).map((entry) => {
    const record = isRecord(entry) ? entry : {}
    return {
      userId: toNumber(record.user_id ?? record.userId ?? record.id),
      username: toText(record.username),
      nickname: toText(record.nickname),
      role: normalizeUserRole(record.role),
      contact: toText(record.contact),
    }
  })

  return { records, hasMore: records.length >= (params.pageSize ?? 20) }
}

/** `PUT /api/admin/users/{user_id}/role` — 调整用户角色（finder_admin ↔ user） */
export async function updateUserRole(
  userId: number,
  role: UserRole,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: `/admin/users/${userId}/role`,
    data: { role },
    ...options,
  })
}
