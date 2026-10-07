import { userRoleMeta } from '@/constants/domain'
import type { UserRole } from '@/types/user'

/** 后台角色：失物招领管理员与系统管理员都能进审核台 */
export function isBackOfficeRole(role: UserRole): boolean {
  return role === 'finder_admin' || role === 'sys_admin'
}

/** 是否为系统管理员 */
export function isSystemAdminRole(role: UserRole): boolean {
  return role === 'sys_admin'
}

/** 角色的中文名 */
export function roleLabel(role: UserRole): string {
  return userRoleMeta[role].label
}

/** 角色对应的状态基调（渲染 .status-pill） */
export function roleTone(role: UserRole): string {
  return userRoleMeta[role].tone
}
