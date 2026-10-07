/**
 * 管理员接口：物品发布审核（待审列表 / 审核 / 全量列表）。
 */
import { req } from './request';
import { normalizeItem } from './items';
import type { ApiResponse, Item, ItemType } from './itemMeta';

function pickItems(data: unknown): any[] {
  if (Array.isArray(data)) return data as any[];
  if (data && typeof data === 'object') {
    const box = data as { items?: any[]; list?: any[]; records?: any[] };
    return box.items ?? box.list ?? box.records ?? [];
  }
  return [];
}

/** 待审核列表：GET /api/admin/items/pending/:type/ */
export async function fetchPendingItems(
  type: ItemType,
  startTime?: string,
  endTime?: string,
): Promise<ApiResponse<Item[]>> {
  const res = (await req.get(`/admin/items/pending/${type}/`, {
    params: { start_time: startTime || undefined, end_time: endTime || undefined },
  })) as unknown as ApiResponse<unknown>;
  return { ...res, data: pickItems(res?.data).map(normalizeItem) };
}

/** 管理员全量物品列表：GET /api/admin/items/ */
export async function fetchAdminItems(params: {
  type?: string;
  category?: string;
  keyword?: string;
  status?: number;
  page?: number;
  page_size?: number;
  start_time?: string;
  end_time?: string;
} = {}): Promise<ApiResponse<Item[]>> {
  const res = (await req.get('/admin/items/', { params })) as unknown as ApiResponse<unknown>;
  return { ...res, data: pickItems(res?.data).map(normalizeItem) };
}

/** 审核操作：POST /api/admin/items/:item_id/:option（approve | reject），驳回可带 reject_reason */
export async function reviewItem(
  itemId: number,
  option: 'approve' | 'reject',
  rejectReason = '',
): Promise<ApiResponse<null>> {
  return req.post(`/admin/items/${itemId}/${option}`, { reject_reason: rejectReason }) as unknown as Promise<ApiResponse<null>>;
}

/** 管理员关闭物品：PUT /api/admin/items/:item_id/ */
export async function adminCloseItem(itemId: number): Promise<ApiResponse<null>> {
  return req.put(`/admin/items/${itemId}/`) as unknown as Promise<ApiResponse<null>>;
}
