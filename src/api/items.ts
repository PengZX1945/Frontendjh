/**
 * 帖子相关接口：上传图片、创建帖子、列表、详情、我的发布、关闭认领通道。
 * 已切换到真实后端（USE_LOCAL_ITEMS = false）。
 */
import { req } from './request';
import type { ApiResponse, CreateItemPayload, Item, ItemListQuery } from './itemMeta';

/** 本地兜底开关：false 表示走真实后端 */
export const USE_LOCAL_ITEMS = false;

/** 上传图片：multipart/form-data，字段名 file，单张 ≤ 5MB */
export async function uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
  const form = new FormData();
  form.append('file', file);
  return req.post('/upload/', form) as unknown as Promise<ApiResponse<{ url: string }>>;
}

/** 把后端返回字段归一化成前端 Item */
export function normalizeItem(raw: any): Item {
  return {
    id: raw.item_id ?? raw.id,
    type: raw.type,
    item_name: raw.item_name,
    category: raw.category,
    location: raw.location ?? '',
    happen_time: raw.happen_time ?? '',
    contact: raw.get_contact ?? raw.contact ?? '',
    description: raw.description ?? '',
    images: Array.isArray(raw.image) ? raw.image : [],
    status: raw.item_status ?? raw.status ?? 0,
    created_at: raw.created_time ?? raw.created_at,
    poster_id: raw.poster_id,
    reject_reason: raw.reject_reason ?? '',
  };
}

/** 列表可能直接返回数组，也可能包在 list / items / records 里，统一成数组 */
function pickList(data: unknown): any[] {
  if (Array.isArray(data)) return data as any[];
  if (data && typeof data === 'object') {
    const box = data as { list?: any[]; items?: any[]; records?: any[] };
    return box.list ?? box.items ?? box.records ?? [];
  }
  return [];
}

/** 发布帖子：后端 POST /api/items/:type，type 走路径参数 */
export async function createItem(payload: CreateItemPayload): Promise<ApiResponse<Item | null>> {
  const { type, ...rest } = payload;
  const body = {
    item_name: rest.item_name,
    category: rest.category,
    location: rest.location,
    happen_time: rest.happen_time,
    description: rest.description,
    image: rest.images,
    get_contact: rest.contact,
    get_location: '',
  };
  return req.post(`/items/${type}`, body) as unknown as Promise<ApiResponse<Item | null>>;
}

/** 帖子列表：后端 GET /api/items/list/:type */
export async function fetchItems(query: ItemListQuery = {}): Promise<ApiResponse<Item[]>> {
  const res = (await req.get(`/items/list/${query.type ?? 'lost'}`, {
    params: {
      keyword: query.keyword || undefined,
      category: query.category || undefined,
      start_time: query.start_time || undefined,
      end_time: query.end_time || undefined,
      page: 1,
      page_size: 20,
    },
  })) as unknown as ApiResponse<unknown>;
  return { ...res, data: pickList(res?.data).map(normalizeItem) };
}

/** 物品详情：后端 GET /api/items/:item_id（公开，可选登录） */
export async function fetchItemDetail(itemId: number | string): Promise<ApiResponse<Item>> {
  const res = (await req.get(`/items/${itemId}`)) as unknown as ApiResponse<any>;
  return { ...res, data: res?.data ? normalizeItem(res.data) : (null as any) };
}

/** 我的发布列表：后端 GET /api/my/items */
export async function fetchMyItems(params: {
  type?: string;
  item_status?: number;
  page?: number;
  page_size?: number;
  start_time?: string;
  end_time?: string;
} = {}): Promise<ApiResponse<Item[]>> {
  const res = (await req.get('/my/items', { params })) as unknown as ApiResponse<unknown>;
  return { ...res, data: pickList(res?.data).map(normalizeItem) };
}

/** 关闭认领通道：后端 POST /api/items/:item_id/close（仅发布者或管理员） */
export async function closeItem(itemId: number): Promise<ApiResponse<null>> {
  return req.post(`/items/${itemId}/close`) as unknown as Promise<ApiResponse<null>>;
}

/** 删除物品：后端 DELETE /api/items/:item_id（仅发布者本人或管理员） */
export async function deleteItem(itemId: number): Promise<ApiResponse<null>> {
  return req.delete(`/items/${itemId}`) as unknown as Promise<ApiResponse<null>>;
}

/** 修改物品详情：后端 PUT /api/items/:item_id（仅发布者本人；改后回到待审核） */
export async function updateItem(itemId: number, payload: CreateItemPayload): Promise<ApiResponse<Item | null>> {
  const { type, ...rest } = payload;
  const body = {
    type,
    item_name: rest.item_name,
    category: rest.category,
    location: rest.location,
    happen_time: rest.happen_time,
    description: rest.description,
    image: rest.images,
    get_contact: rest.contact,
    get_location: '',
  };
  return req.put(`/items/${itemId}`, body) as unknown as Promise<ApiResponse<Item | null>>;
}
