/** 物品大类：失物招领 / 寻物启事 */
export type ItemType = 'found' | 'lost'

/**
 * 物品状态。
 * 0 待审核 / 1 已发布 / 2 已驳回 / 3 已关闭（认领完成或线下确认后关闭）
 */
export type ItemStatus = 0 | 1 | 2 | 3

/**
 * 物品记录（前端小驼峰模型）。
 *
 * 接口字段是下划线命名（`item_name`、`happen_time`…），归一化在
 * `utils/item-normalizers.ts` 完成，页面只面对这一层。
 */
export interface ItemRecord {
  itemId: number
  type: ItemType
  itemName: string
  category: string
  /** 发现 / 遗失地点 */
  location: string
  /** 发现 / 遗失时间 */
  happenTime: string
  /** 发布者联系方式 */
  posterContact: string
  description: string
  /** 图片 URL 列表，0–5 张 */
  images: string[]
  itemStatus: ItemStatus
  createdTime: string
  lastEditTime: string
  /** 审核驳回理由 */
  rejectReason: string
  posterId: number
  /** 领取地点 */
  getLocation: string
  /** 领取联系方式 */
  getContact: string
}

/** 发布 / 修改物品的请求体（修改为全量更新，字段与发布一致） */
export interface ItemFormPayload {
  type: ItemType
  itemName: string
  category: string
  location: string
  happenTime: string
  description: string
  images: string[]
  getLocation: string
  getContact: string
}

/** `GET /api/items/list/{type}/` 的查询参数 */
export interface ItemQueryParams {
  page?: number
  pageSize?: number
  category?: string
  startTime?: string
  endTime?: string
  location?: string
  keyword?: string
}

/** 管理端 `GET /api/admin/items/` 的查询参数 */
export interface AdminItemQueryParams {
  type?: ItemType
  status?: ItemStatus
  category?: string
  keyword?: string
  page?: number
  pageSize?: number
}

/** 发布表单的本地草稿形态（发布页表单直接绑定，字段同 `ItemFormPayload`，去掉 type） */
export type ItemFormDraft = Omit<ItemFormPayload, 'type'>
