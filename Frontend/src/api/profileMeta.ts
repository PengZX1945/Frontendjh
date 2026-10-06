/**
 * 个人信息的类型与校验规则。
 * 昵称 / 电话的规则放这里，弹窗和后续的「我的」页面共用一套提示。
 */

/** 后端 GET /auth/profile 返回的用户信息，字段与接口文档 1.4 一致 */
export interface UserProfile {
  id: number;
  username: string;
  nickname: string;
  role: string;
  contact: string;
}

/** PUT /auth/profile 请求体：接口只接受昵称和联系方式，用户名不可改 */
export interface UpdateProfilePayload {
  nickname: string;
  contact: string;
}

/** PUT /auth/password 请求体 */
export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

/** 字段长度上限，与接口文档一致：nickname ≤ 64、contact ≤ 128 */
export const NICKNAME_MAX_LENGTH = 64;
export const CONTACT_MAX_LENGTH = 128;

/** 昵称：非空 + 长度限制 */
export function validateNickname(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '请输入昵称';
  if (trimmed.length > NICKNAME_MAX_LENGTH) return `昵称不能超过 ${NICKNAME_MAX_LENGTH} 个字符`;
  return '';
}

/** 联系方式：非空 + 长度限制（文档允许 128 字符，故不限死手机号格式） */
export function validateContact(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '请输入电话号码';
  if (trimmed.length > CONTACT_MAX_LENGTH) return `联系方式不能超过 ${CONTACT_MAX_LENGTH} 个字符`;
  return '';
}
