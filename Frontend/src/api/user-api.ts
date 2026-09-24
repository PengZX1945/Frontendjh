import type { AxiosResponse } from 'axios'
import { getJson, postJson, putJson, readResponsePayload } from '@/api/http'
import type { ApiRequestOptions } from '@/types/api'
import type {
  LoginPayload,
  LoginSession,
  PasswordChangePayload,
  ProfileChangePayload,
  RegisterPayload,
  UserProfile,
} from '@/types/user'
import { toText } from '@/utils/type-guards'
import {
  findAuthToken,
  findUserProfile,
  toLogoutRequestBody,
  toPasswordRequestBody,
  toProfileRequestBody,
  toUserProfile,
} from '@/utils/user-normalizers'

/**
 * 用户模块接口（对应接口文档「用户」章节），路径均相对于 `/api`。
 * 请求体字段按后端约定使用下划线命名，页面层只传 camelCase 模型。
 */

const registerPath = '/auth/register'
const loginPath = '/auth/login'
const logoutPath = '/auth/logout'
const profilePath = '/auth/profile'
const passwordPath = '/auth/password'

/** 响应头里可能承载凭证的字段名 */
const authTokenHeaderNames = ['authorization', 'x-token', 'x-auth-token', 'token']

/** POST /api/auth/register —— 注册成功返回空数据，失败见 409（用户名已存在） */
export async function registerUser(
  payload: RegisterPayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await postJson<null>(
    registerPath,
    {
      username: toText(payload.username),
      password: payload.password,
      nickname: toText(payload.nickname),
      contact: toText(payload.contact),
    },
    { ...options, skipAuth: true },
  )
}

/**
 * POST /api/auth/login —— 返回登录会话。
 * 接口文档标注 `data: null`，未说明凭证位置，故此处容错探测：
 * 响应体字段 → 嵌套对象 → 响应头，全部取不到时返回空凭证（交由 store 兜底判断）。
 */
export async function loginUser(
  payload: LoginPayload,
  options: ApiRequestOptions = {},
): Promise<LoginSession> {
  const response = await postJson<unknown>(
    loginPath,
    { username: toText(payload.username), password: payload.password },
    { ...options, skipAuth: true },
  )

  return {
    authToken: findAuthToken(response.data) || readTokenFromHeaders(response),
    userProfile: findUserProfile(response.data),
  }
}

/** POST /api/auth/logout —— 按文档要求携带当前用户信息 */
export async function logoutUser(
  currentUser: UserProfile,
  options: ApiRequestOptions = {},
): Promise<void> {
  await postJson<null>(logoutPath, toLogoutRequestBody(currentUser), options)
}

/** GET /api/auth/profile —— 取当前登录用户档案（响应里可能是 `id` 或 `user_id`） */
export async function fetchUserProfile(options: ApiRequestOptions = {}): Promise<UserProfile> {
  const response = await getJson<unknown>(profilePath, options)
  return toUserProfile(readResponsePayload(response))
}

/** PUT /api/auth/profile?user_id=xx —— 修改昵称与联系方式 */
export async function updateUserProfile(
  currentUser: UserProfile,
  changes: ProfileChangePayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await putJson<null>(profilePath, toProfileRequestBody(currentUser, changes), {
    ...options,
    params: { user_id: currentUser.userId, ...options.params },
  })
}

/** PUT /api/auth/password?user_id=xx —— 修改密码，需校验旧密码 */
export async function changeUserPassword(
  currentUser: UserProfile,
  payload: PasswordChangePayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await putJson<null>(
    passwordPath,
    toPasswordRequestBody(currentUser, payload.oldPassword, payload.newPassword),
    { ...options, params: { user_id: currentUser.userId, ...options.params } },
  )
}

/** 兜底：部分后端把 JWT 放在响应头而非响应体 */
function readTokenFromHeaders(response: AxiosResponse): string {
  for (const headerName of authTokenHeaderNames) {
    const headerValue = response.headers?.[headerName]
    if (typeof headerValue === 'string' && headerValue.trim()) {
      return headerValue.replace(/^Bearer\s+/i, '').trim()
    }
  }
  return ''
}
