/**
 * 公告相关接口：公开阅读；创建/编辑/删除仅系统管理员。
 */
import { req } from './request';
import type { ApiResponse } from './itemMeta';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** 公开：GET /api/announcements/ 最新公告 */
export async function fetchAnnouncements(limit = 5): Promise<ApiResponse<{ announcements: Announcement[] }>> {
  return req.get('/announcements/', { params: { limit } }) as unknown as Promise<ApiResponse<{ announcements: Announcement[] }>>;
}

/** 系统管理员：POST /api/admin/announcements/ 创建公告 */
export async function createAnnouncement(title: string, content: string): Promise<ApiResponse<{ announcement: Announcement }>> {
  return req.post('/admin/announcements/', { title, content }) as unknown as Promise<ApiResponse<{ announcement: Announcement }>>;
}

/** 系统管理员：PUT /api/admin/announcements/:id/ 编辑公告 */
export async function updateAnnouncement(id: number, title: string, content: string): Promise<ApiResponse<null>> {
  return req.put(`/admin/announcements/${id}/`, { title, content }) as unknown as Promise<ApiResponse<null>>;
}

/** 系统管理员：DELETE /api/admin/announcements/:id/ 删除公告 */
export async function deleteAnnouncement(id: number): Promise<ApiResponse<null>> {
  return req.delete(`/admin/announcements/${id}/`) as unknown as Promise<ApiResponse<null>>;
}
