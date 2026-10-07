/**
 * 用户账号相关接口：服务端登出、修改资料、修改密码。
 */
import { req } from './request';
import type { ApiResponse } from './itemMeta';

/** 服务端登出：POST /api/auth/logout（token 放请求头，由请求拦截器自动携带） */
export async function logout(): Promise<ApiResponse<null>> {
  // _skipAuthRedirect：主动退出即使后端返回 401 也跳过 request.js 的登录页跳转，
  // 保证退出登录后停留在当前页面不变
  return req.post('/auth/logout', null, { _skipAuthRedirect: true } as never) as unknown as Promise<ApiResponse<null>>;
}

/** 修改个人资料（昵称 / 联系方式）：PUT /api/auth/profile */
export async function updateProfile(nickname: string, contact: string): Promise<ApiResponse<null>> {
  return req.put('/auth/profile', { nickname, contact }) as unknown as Promise<ApiResponse<null>>;
}

/** 修改密码：PUT /api/auth/password */
export async function changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<null>> {
  return req.put('/auth/password', { old_password: oldPassword, new_password: newPassword }) as unknown as Promise<ApiResponse<null>>;
}

/** 系统管理员用户列表（仅 sys_admin）：GET /api/admin/users */
export interface AdminUserItem {
  user_id: number;
  username: string;
  nickname: string;
  role: string;
  contact: string;
  status: number;
}
export async function fetchAdminUsers(params: {
  keyword?: string;
  role?: string;
  page?: number;
  page_size?: number;
}): Promise<ApiResponse<{ users: AdminUserItem[] }>> {
  return req.get('/admin/users', { params }) as unknown as Promise<ApiResponse<{ users: AdminUserItem[] }>>;
}

/** 系统管理员修改用户角色（仅 sys_admin）：PUT /api/admin/users/:user_id/role */
export async function updateUserRole(userId: number, role: string): Promise<ApiResponse<null>> {
  return req.put(`/admin/users/${userId}/role`, { role }) as unknown as Promise<ApiResponse<null>>;
}

/** 系统管理员启用 / 禁用用户（仅 sys_admin）：PUT /api/admin/users/:user_id/status */
export async function updateUserStatus(userId: number, status: number): Promise<ApiResponse<null>> {
  return req.put(`/admin/users/${userId}/status`, { status }) as unknown as Promise<ApiResponse<null>>;
}
