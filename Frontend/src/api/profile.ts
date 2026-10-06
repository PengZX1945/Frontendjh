/**
 * 个人信息相关接口：1.4 获取信息 / 1.5 修改信息 / 1.6 修改密码。
 * 与 api/items.ts 一样受 USE_LOCAL_API 控制，后端就绪后改成 false 即可。
 *
 * 注意：1.5、1.6 的 user_id 是 query 参数，值取 1.4 返回的 data.id（即接口文档里的「从 auth 传入」）。
 */
import { req } from './request';
import { USE_LOCAL_API } from './localMode';
import { localChangePassword, localFetchProfile, localUpdateProfile } from './localProfile';
import type { ApiResponse } from './apiTypes';
import type { ChangePasswordPayload, UpdateProfilePayload, UserProfile } from './profileMeta';

/** 接口路径，与接口文档 1.4 / 1.5 / 1.6 一致 */
const PROFILE_PATH = '/auth/profile';
const PASSWORD_PATH = '/auth/password';

/** 1.4 获取当前用户信息（需登录）：不需要参数，身份由 token 决定 */
export async function fetchProfile(): Promise<ApiResponse<UserProfile>> {
  if (USE_LOCAL_API) {
    return localFetchProfile();
  }

  return req.get(PROFILE_PATH) as unknown as Promise<ApiResponse<UserProfile>>;
}

/** 1.5 修改个人信息（需登录）：query 带 user_id，body 只接受昵称与联系方式，成功时 data 为 null */
export async function updateProfile(
  userId: number,
  payload: UpdateProfilePayload,
): Promise<ApiResponse<null>> {
  if (USE_LOCAL_API) {
    return localUpdateProfile(userId, payload);
  }

  return req.put(PROFILE_PATH, payload, {
    params: { user_id: userId },
  }) as unknown as Promise<ApiResponse<null>>;
}

/** 1.6 修改密码（需登录）：query 带 user_id，原密码错误返回 10006，成功后前端要重新登录 */
export async function changePassword(
  userId: number,
  payload: ChangePasswordPayload,
): Promise<ApiResponse<null>> {
  if (USE_LOCAL_API) {
    return localChangePassword(userId, payload.old_password, payload.new_password);
  }

  return req.put(PASSWORD_PATH, payload, {
    params: { user_id: userId },
  }) as unknown as Promise<ApiResponse<null>>;
}
