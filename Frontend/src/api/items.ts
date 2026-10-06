/**
 * 帖子相关接口：上传图片、创建帖子、拉取列表。
 *
 * 用 USE_LOCAL_API 本地兜底：开关打开时数据走 localStorage，
 * 
 */
import { req } from './request';
import { USE_LOCAL_API } from './localMode';
import { localCreateItem, localListItems, localUploadImage } from './localItems';
import type { ApiResponse, CreateItemPayload, Item, ItemListQuery } from './itemMeta';

/** 接口路径，后端文档确认后改这里即可 */
const UPLOAD_PATH = '/upload';
const ITEMS_PATH = '/posts';

/**
 * 上传图片：multipart/form-data，字段名 file，单张 ≤ 5MB。
 * 成功返回 data.url；格式 / 大小不合法时后端返回 10008。
 */
export async function uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
  if (USE_LOCAL_API) {
    const url = await localUploadImage(file);
    return { code: 0, msg: 'success', data: { url } };
  }

  const form = new FormData();
  form.append('file', file);
  return req.post(UPLOAD_PATH, form) as unknown as Promise<ApiResponse<{ url: string }>>;
}

/** 创建帖子：创建后 status = 0（待审核），审核通过后才公开 */
export async function createItem(payload: CreateItemPayload): Promise<ApiResponse<Item>> {
  if (USE_LOCAL_API) {
    return { code: 0, msg: 'success', data: localCreateItem(payload) };
  }

  return req.post(ITEMS_PATH, payload) as unknown as Promise<ApiResponse<Item>>;
}

/** 帖子列表：按类型 / 关键词 / 分类查询 */
export async function fetchItems(query: ItemListQuery = {}): Promise<ApiResponse<Item[]>> {
  if (USE_LOCAL_API) {
    return { code: 0, msg: 'success', data: localListItems(query) };
  }

  const res = (await req.get(ITEMS_PATH, { params: query })) as unknown as ApiResponse<unknown>;
  return { ...res, data: pickList(res?.data) };
}

/** 列表可能直接返回数组，也可能包在 list / items / records 里，这里统一成数组 */
function pickList(data: unknown): Item[] {
  if (Array.isArray(data)) return data as Item[];

  if (data && typeof data === 'object') {
    const box = data as { list?: Item[]; items?: Item[]; records?: Item[] };
    return box.list ?? box.items ?? box.records ?? [];
  }

  return [];
}
