/** 系统内置的三种角色（见项目 README 第 5 节） */
export type UserRole = 'user' | 'finder_admin' | 'sys_admin'

/** 用户档案：`GET /api/auth/profile` 返回的 data */
export interface UserProfile {
  /** 用户 ID（响应里可能是 `id` 或 `user_id`，统一收敛为 userId） */
  userId: number
  username: string
  nickname: string
  role: UserRole
  contact: string
}

/** `POST /api/auth/login` 请求体 */
export interface LoginPayload {
  username: string
  password: string
}

/** `POST /api/auth/register` 请求体 */
export interface RegisterPayload {
  username: string
  password: string
  nickname: string
  contact: string
}

/** `PUT /api/auth/profile` 允许修改的字段（用户名与角色不可改） */
export interface ProfileChangePayload {
  nickname: string
  contact: string
}

/** `PUT /api/auth/password` 请求体 */
export interface PasswordChangePayload {
  oldPassword: string
  newPassword: string
}

/** 登录成功后落在前端本地的会话 */
export interface LoginSession {
  /** JWT 凭证；后端若改用 Cookie 会话，此处可能为空串 */
  authToken: string
  /** 登录响应里自带用户信息时直接复用，否则由调用方再拉一次档案 */
  userProfile: UserProfile | null
}
