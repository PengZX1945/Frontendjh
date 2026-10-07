import type { ItemRecord, ItemStatus, ItemType } from '@/types/item'
import { isRecord, toNumber, toText, toTextArray } from '@/utils/type-guards'

/** 物品状态收敛：只接受 0–3，其余按「待审核」处理 */
export function normalizeItemStatus(value: unknown): ItemStatus {
  const status = toNumber(value)
  if (status === 1 || status === 2 || status === 3) return status
  return 0
}

/** 物品大类收敛：只认 `lost` / `found`，未知值按调用方给的兜底大类处理 */
export function normalizeItemType(value: unknown, fallback: ItemType = 'lost'): ItemType {
  const text = toText(value)
  if (text === 'lost' || text === 'found') return text
  return fallback
}

/**
 * 归一化物品记录。
 *
 * 兼容点：
 * - 状态字段可能是 `item_status`（列表/详情）也可能被简化成 `status`；
 * - 图片字段可能是 `image` 也可能是 `images`；
 * - 发布者 ID 可能是 `poster_id` 也可能是 `user_id`。
 */
export function normalizeItemRecord(raw: unknown, fallbackType: ItemType = 'lost'): ItemRecord {
  const record = isRecord(raw) ? raw : {}
  return {
    itemId: toNumber(record.itemId ?? record.item_id ?? record.id),
    type: normalizeItemType(record.type, fallbackType),
    itemName: toText(record.item_name ?? record.itemName),
    category: toText(record.category),
    location: toText(record.location),
    happenTime: toText(record.happen_time ?? record.happenTime),
    posterContact: toText(record.poster_contact ?? record.posterContact),
    description: toText(record.description),
    images: toTextArray(record.image ?? record.images),
    itemStatus: normalizeItemStatus(record.item_status ?? record.itemStatus ?? record.status),
    createdTime: toText(record.created_time ?? record.createdTime),
    lastEditTime: toText(record.last_edit_time ?? record.lastEditTime),
    rejectReason: toText(record.reject_reason ?? record.rejectReason),
    posterId: toNumber(record.poster_id ?? record.posterId ?? record.user_id),
    getLocation: toText(record.get_location ?? record.getLocation),
    getContact: toText(record.get_contact ?? record.getContact),
  }
}

/** 批量归一化物品列表 */
export function normalizeItemList(raw: unknown, fallbackType: ItemType = 'lost'): ItemRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => normalizeItemRecord(entry, fallbackType))
}
