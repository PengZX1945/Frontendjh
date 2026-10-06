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
  PUBLISHED: 1,
  REJECTED: 2,
  CLAIMED: 3,
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
}

/** 后端统一响应结构，定义在 api/apiTypes.ts，这里转出方便按帖子模块导入 */
export type { ApiResponse } from './apiTypes';

/** 日期 → "AAAA-BB-CC DD:ee:ff" */
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

/** 角色过滤：用户只能看到已发布 / 已认领 / 自己发布的帖子 */
export function filterVisibleItems(items: Item[], isAdmin: boolean): Item[] {
  if (isAdmin) return items;
  return items.filter((item) => USER_VISIBLE_STATUSES.includes(item.status));
}
