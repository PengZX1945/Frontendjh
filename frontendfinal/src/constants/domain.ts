import type { AnnouncementStatus } from '@/types/announcement'
import type { ClaimStatus } from '@/types/claim'
import type { ItemStatus, ItemType } from '@/types/item'
import type { UserRole } from '@/types/user'

/** 状态标签的视觉基调，对应 styles/base.css 里的 .status-pill--* */
export type StatusTone = 'neutral' | 'accent' | 'positive' | 'warning' | 'danger'

/** 一枚可展示的状态：中文名 + 视觉基调 */
export interface StatusMeta {
  label: string
  tone: StatusTone
}

/** ── 物品分类（接口文档「通用约定」给定，顺序即展示顺序） ── */
export const itemCategoryOptions = [
  '卡证',
  '数码电子',
  '挂饰饰品',
  '箱包',
  '钥匙',
  '书籍文具',
  '衣物',
  '现金钱包',
  '其他',
] as const

export type ItemCategory = (typeof itemCategoryOptions)[number]

/** ── 物品大类 ── */
export const itemTypeMeta: Record<
  ItemType,
  { label: string; actionLabel: string; description: string; tone: StatusTone }
> = {
  lost: {
    label: '寻物启事',
    actionLabel: '发布寻物启事',
    description: '东西丢了，在这里描述特征与丢失地点，等待拾到者联系。',
    tone: 'accent',
  },
  found: {
    label: '失物招领',
    actionLabel: '发布失物招领',
    description: '捡到东西了，在这里登记保管信息，等待失主认领。',
    tone: 'positive',
  },
}

/** 信息流与详情页共用的大类顺序：寻物启事在前，与首页默认口径一致 */
export const itemTypeOptions: ItemType[] = ['lost', 'found']

/** ── 物品状态 ── */
export const itemStatusMeta: Record<ItemStatus, StatusMeta> = {
  0: { label: '待审核', tone: 'warning' },
  1: { label: '已发布', tone: 'positive' },
  2: { label: '已驳回', tone: 'danger' },
  3: { label: '已关闭', tone: 'neutral' },
}

export const itemStatusOptions: ItemStatus[] = [0, 1, 2, 3]

/** ── 认领申请状态 ── */
export const claimStatusMeta: Record<ClaimStatus, StatusMeta> = {
  0: { label: '待审批', tone: 'warning' },
  1: { label: '已通过', tone: 'positive' },
  2: { label: '已驳回', tone: 'danger' },
  3: { label: '已取消', tone: 'neutral' },
}

export const claimStatusOptions: ClaimStatus[] = [0, 1, 2, 3]

/** ── 公告状态 ── */
export const announcementStatusMeta: Record<AnnouncementStatus, StatusMeta> = {
  0: { label: '公开', tone: 'positive' },
  1: { label: '已下线', tone: 'neutral' },
}

/** ── 角色 ── */
export const userRoleMeta: Record<UserRole, { label: string; tone: StatusTone }> = {
  user: { label: '普通用户', tone: 'neutral' },
  finder_admin: { label: '失物招领管理员', tone: 'accent' },
  sys_admin: { label: '系统管理员', tone: 'danger' },
}

/** ── 分页默认尺寸 ── */
export const defaultPageSize = 12

/** 上传限制（接口文档：jpg/jpeg/png/webp，单张 ≤ 5MB，发布最多 5 张） */
export const uploadConstraints = {
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxImageCount: 5,
} as const

/** 表单长度约束：后端未给，前端按体验自定 */
export const formLimits = {
  usernameMinLength: 3,
  usernameMaxLength: 20,
  passwordMinLength: 6,
  passwordMaxLength: 32,
  nicknameMaxLength: 20,
  contactMaxLength: 40,
  itemNameMaxLength: 40,
  locationMaxLength: 60,
  descriptionMaxLength: 500,
  reasonMaxLength: 200,
  claimReasonMinLength: 5,
  announcementTitleMaxLength: 60,
  announcementContentMaxLength: 5000,
} as const
