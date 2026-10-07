import { request, sendRequest } from '@/api/http'
import { defaultPageSize } from '@/constants/domain'
import { buildPagedResult } from '@/utils/paged-result'
import { normalizeItemList, normalizeItemRecord } from '@/utils/item-normalizers'
import { readRecordList } from '@/utils/type-guards'
import type { ApiRequestOptions, PagedResult } from '@/types/api'
import type {
  AdminItemQueryParams,
  ItemFormPayload,
  ItemQueryParams,
  ItemRecord,
  ItemStatus,
  ItemType,
} from '@/types/item'

/** 前端小驼峰表单 → 后端下划线请求体（发布与修改共用，修改是全量更新） */
function toItemRequestBody(payload: ItemFormPayload): Record<string, unknown> {
  return {
    item_name: payload.itemName,
    category: payload.category,
    location: payload.location,
    happen_time: payload.happenTime,
    description: payload.description,
    image: payload.images,
    get_location: payload.getLocation,
    get_contact: payload.getContact,
  }
}

/**
 * `GET /api/items/list/{type}/` — 公开信息流。
 * 后端只返回「已发布」且按 `happen_time` 倒序，前端的滚动加载直接翻页即可。
 */
export async function fetchItemList(
  type: ItemType,
  params: ItemQueryParams = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<ItemRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: `/items/list/${type}/`,
    params: {
      page: params.page,
      page_size: pageSize,
      category: params.category || undefined,
      start_time: params.startTime || undefined,
      end_time: params.endTime || undefined,
      location: params.location || undefined,
      keyword: params.keyword || undefined,
    },
    ...options,
  })

  const records = normalizeItemList(readRecordList(rawResponse.body, ['items']), type)
  return buildPagedResult(records, pageSize)
}

/**
 * `GET /api/items/{item_id}` — 物品详情。
 * 待审核 / 已驳回的记录只有本人与管理员可见，其他情况后端返回 code 4。
 */
export async function fetchItemDetail(
  itemId: number,
  options: ApiRequestOptions = {},
): Promise<ItemRecord> {
  const rawBody = await request<unknown>({ method: 'get', url: `/items/${itemId}`, ...options })
  return normalizeItemRecord(rawBody)
}

/** `POST /api/items/{type}` — 发布（创建后为「待审核」） */
export async function createItem(
  type: ItemType,
  payload: ItemFormPayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'post',
    url: `/items/${type}`,
    data: toItemRequestBody(payload),
    ...options,
  })
}

/**
 * `PUT /api/items/{item_id}` — 修改（**全量更新**，未传的字段会被覆盖）。
 * 仅「待审核 / 已驳回 / 已发布」可改，改完状态重置为待审核。
 */
export async function updateItem(
  itemId: number,
  payload: ItemFormPayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: `/items/${itemId}`,
    data: toItemRequestBody(payload),
    ...options,
  })
}

/** `DELETE /api/items/{item_id}` — 删除（本人或管理员） */
export async function deleteItem(itemId: number, options: ApiRequestOptions = {}): Promise<void> {
  await request<void>({ method: 'delete', url: `/items/${itemId}`, ...options })
}

/** `GET /api/my/items` — 我的发布（含全部状态与驳回原因） */
export async function fetchMyItems(
  params: { type?: ItemType; itemStatus?: ItemStatus; page?: number; pageSize?: number } = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<ItemRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: '/my/items',
    params: {
      type: params.type || undefined,
      item_status: params.itemStatus,
      page: params.page,
      page_size: pageSize,
    },
    ...options,
  })

  const records = normalizeItemList(
    readRecordList(rawResponse.body, ['items']),
    params.type ?? 'lost',
  )
  return buildPagedResult(records, pageSize)
}

/** `POST /api/items/{item_id}/close` — 关闭认领通道（本人或管理员） */
export async function closeItemClaim(
  itemId: number,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({ method: 'post', url: `/items/${itemId}/close`, ...options })
}

/** 管理端：`GET /api/admin/items/pending/{type}/` — 待审核列表 */
export async function fetchPendingItems(
  type: ItemType,
  params: { page?: number; pageSize?: number } = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<ItemRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: `/admin/items/pending/${type}/`,
    params: { page: params.page, page_size: pageSize },
    ...options,
  })

  const records = normalizeItemList(readRecordList(rawResponse.body, ['items']), type)
  return buildPagedResult(records, pageSize)
}

/** 管理端：`GET /api/admin/items/` — 全校物品总览（可按状态 / 分类 / 关键词过滤） */
export async function fetchAllItems(
  params: AdminItemQueryParams = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<ItemRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: '/admin/items/',
    params: {
      type: params.type || undefined,
      status: params.status,
      category: params.category || undefined,
      keyword: params.keyword || undefined,
      page: params.page,
      page_size: pageSize,
    },
    ...options,
  })

  const records = normalizeItemList(
    readRecordList(rawResponse.body, ['items']),
    params.type ?? 'lost',
  )
  return buildPagedResult(records, pageSize)
}

/**
 * 管理端：`POST /api/admin/items/{item_id}/{option}` — 审核（通过 / 驳回）。
 * 驳回理由字段文档未定义请求体，这里按「响应里回传 reject_reason」的线索，
 * 在驳回时随请求体提交，后端若不接收该字段也不影响审核动作本身。
 */
export async function reviewItem(
  itemId: number,
  option: 'approve' | 'reject',
  rejectReason = '',
  options: ApiRequestOptions = {},
): Promise<string> {
  const rawBody = await request<unknown>({
    method: 'post',
    url: `/admin/items/${itemId}/${option}`,
    data:
      option === 'reject' && rejectReason.trim() !== ''
        ? { reject_reason: rejectReason.trim() }
        : undefined,
    ...options,
  })
  if (typeof rawBody === 'object' && rawBody !== null && 'reject_reason' in rawBody) {
    const value = (rawBody as { reject_reason?: unknown }).reject_reason
    return typeof value === 'string' ? value : ''
  }
  return ''
}

/** 管理端：`PUT /api/admin/items/{item_id}/` — 仅用于把状态置为 3（线下确认后关闭） */
export async function closeItemByAdmin(
  itemId: number,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: `/admin/items/${itemId}/`,
    data: { status: 3 },
    ...options,
  })
}
