/**
 * 帖子（招领 / 寻物）的公共类型、状态与分类定义。
 * 页面和 api 层都从这里取，避免状态文案、分类列表各写一份。
 */

/** 帖子类型：found 招领（捡到物品）/ lost 寻物（物品遗失），取值与接口字段一致 */
export type ItemType = 'found' | 'lost';

/** 帖子状态，取值与接口 status 字段一致 */
export const ItemStatus = {
  /** 待审核：刚创建，审核通过后才公开 */
  PENDING: 0,
  /** 已发布 */
  PUBLISHED: 1,
  /** 已驳回 */
  REJECTED: 2,
  /** 已认领 */
  CLAIMED: 3,
  /** 已关闭 */
  CLOSED: 4,
} as const;

/** 状态 → 展示文案 */
export const ITEM_STATUS_LABEL: Record<number, string> = {
  [ItemStatus.PENDING]: '待审核',
  [ItemStatus.PUBLISHED]: '已发布',
  [ItemStatus.REJECTED]: '已驳回',
  [ItemStatus.CLAIMED]: '已认领',
  [ItemStatus.CLOSED]: '已关闭',
};

/** 普通用户可见的状态：只有已发布和已认领；管理员不受限 */
export const USER_VISIBLE_STATUSES: readonly number[] = [ItemStatus.PUBLISHED, ItemStatus.CLAIMED];

/** 物品分类，值直接用中文，与接口示例的 category 字段一致 */
export const ITEM_CATEGORIES: readonly string[] = [
  '卡证',
  '数码电子',
  '挂饰饰品',
  '箱包',
  '衣物',
  '钥匙',
  '现金钱包',
  '书籍文具',
  '其他',
];

/** 上传限制：格式、单张大小、张数 */
export const UPLOAD_ACCEPT: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
export const UPLOAD_MAX_SIZE = 5 * 1024 * 1024;
export const UPLOAD_MAX_COUNT = 5;

/** 一条帖子，字段与接口一致 */
export interface Item {
  id: number;
  type: ItemType;
  item_name: string;
  category: string;
  location: string;
  happen_time: string;
  contact: string;
  description: string;
  /** 图片 URL 列表，0-5 张，来自上传接口 */
  images: string[];
  status: number;
  created_at?: string;
  /** 发布者用户 ID，用于详情页判断「是否本人发布」 */
  poster_id?: number;
  /** 驳回理由（仅被驳回时非空） */
  reject_reason?: string;
}

/** 创建帖子的请求体 */
export interface CreateItemPayload {
  type: ItemType;
  item_name: string;
  category: string;
  location: string;
  happen_time: string;
  contact: string;
  description: string;
  images: string[];
}

/** 列表查询参数 */
export interface ItemListQuery {
  type?: ItemType;
  keyword?: string;
  category?: string;
  /** 时间区间筛选（按物品发生时间 happen_time） */
  start_time?: string;
  end_time?: string;
}

/** 后端统一响应结构：code === 0 表示成功 */
export interface ApiResponse<T> {
  code: number;
  msg?: string;
  data?: T | null;
}

/** Date → "YYYY-MM-DD HH:mm:ss" */
export function toDateTimeString(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const ymd = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-');
  const hms = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(':');
  return `${ymd} ${hms}`;
}

/** 列表里时间只显示到分钟 */
export function formatItemTime(time: string): string {
  return time ? time.slice(0, 16) : '';
}

/** 角色过滤：用户只能看到已发布 / 已认领 */
export function filterVisibleItems(items: Item[], isAdmin: boolean): Item[] {
  if (isAdmin) return items;
  return items.filter((item) => USER_VISIBLE_STATUSES.includes(item.status));
}


/** 认领申请状态，取值与接口 claim_status 字段一致 */
export const ClaimStatus = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
} as const;

/** 认领申请状态 → 展示文案 */
export const CLAIM_STATUS_LABEL: Record<number, string> = {
  [ClaimStatus.PENDING]: '待审批',
  [ClaimStatus.APPROVED]: '已通过',
  [ClaimStatus.REJECTED]: '已驳回',
};

/** 一条认领申请，字段与后端 claimResponse 一致 */
export interface Claim {
  claim_id: number;
  item_id: number;
  applicant_id: number;
  reason: string;
  applicant_contact: string;
  claim_status: number;
  created_time?: string;
  last_edit_time?: string;
}
