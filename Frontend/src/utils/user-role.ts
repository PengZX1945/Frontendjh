import type { UserRole } from '@/types/user'

/** 角色中文名，用于个人中心等界面的展示 */
const userRoleLabels: Record<UserRole, string> = {
  user: '普通用户',
  finder_admin: '失物招领管理员',
  sys_admin: '系统管理员',
}

const knownUserRoles: UserRole[] = ['user', 'finder_admin', 'sys_admin']

/** 把后端返回的角色字符串收敛为内置角色，未知角色一律按普通用户处理 */
export function toUserRole(role: string): UserRole {
  const matchedRole = knownUserRoles.find((knownRole) => knownRole === role)
  return matchedRole ?? 'user'
}

/** 角色中文名；未知角色回落为原始字符串，避免界面出现空白 */
export function toUserRoleLabel(role: string): string {
  return userRoleLabels[toUserRole(role)] ?? role
}
