import { request, sendRequest } from '@/api/http'
import { defaultPageSize } from '@/constants/domain'
import { buildPagedResult } from '@/utils/paged-result'
import {
  normalizeAnnouncementList,
  normalizeAnnouncementRecord,
} from '@/utils/announcement-normalizers'
import { readRecordList } from '@/utils/type-guards'
import type { ApiRequestOptions, PagedResult } from '@/types/api'
import type {
  AnnouncementPayload,
  AnnouncementQueryParams,
  AnnouncementRecord,
  AnnouncementStatus,
} from '@/types/announcement'

/** `GET /api/announcements/` — 公告列表（仅公开状态的公告） */
export async function fetchAnnouncementList(
  params: AnnouncementQueryParams = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<AnnouncementRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: '/announcements/',
    params: { page: params.page, page_size: pageSize },
    ...options,
  })

  const records = normalizeAnnouncementList(readRecordList(rawResponse.body, ['announcements']))
  return buildPagedResult(records, pageSize)
}

/** `GET /api/announcements/{announcement_id}` — 公告详情 */
export async function fetchAnnouncementDetail(
  announcementId: number,
  options: ApiRequestOptions = {},
): Promise<AnnouncementRecord> {
  const rawBody = await request<unknown>({
    method: 'get',
    url: `/announcements/${announcementId}`,
    ...options,
  })
  return normalizeAnnouncementRecord(rawBody)
}

/** 管理端：`GET /api/admin/announcements/` — 全部公告（含已下线） */
export async function fetchAllAnnouncements(
  params: AnnouncementQueryParams = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<AnnouncementRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: '/admin/announcements/',
    params: { page: params.page, page_size: pageSize },
    ...options,
  })

  const records = normalizeAnnouncementList(readRecordList(rawResponse.body, ['announcements']))
  return buildPagedResult(records, pageSize)
}

/** 管理端：`POST /api/admin/announcements/` — 发布公告 */
export async function createAnnouncement(
  payload: AnnouncementPayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({ method: 'post', url: '/admin/announcements/', data: payload, ...options })
}

/** 管理端：`PUT /api/admin/announcements/{id}` — 修改公告 */
export async function updateAnnouncement(
  announcementId: number,
  payload: AnnouncementPayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: `/admin/announcements/${announcementId}`,
    data: payload,
    ...options,
  })
}

/**
 * 管理端：公告上下线（0 公开 / 1 已下线）。
 *
 * 文档把「已下线公告」写进了数据模型与「获取所有公告」的说明里，却没有给出独立的
 * 上下线接口，因此这里按 PUT 修改公告的语义，在请求体里附带 `announcement_status`。
 * 若后端不接受该字段，这个动作会被忽略，其余字段仍按原样提交（见交付说明的假设清单）。
 */
export async function updateAnnouncementStatus(
  announcement: AnnouncementRecord,
  status: AnnouncementStatus,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: `/admin/announcements/${announcement.announcementId}`,
    data: {
      title: announcement.title,
      content: announcement.content,
      announcement_status: status,
    },
    ...options,
  })
}

/** 管理端：`DELETE /api/admin/announcements/{id}` — 删除公告 */
export async function deleteAnnouncement(
  announcementId: number,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'delete',
    url: `/admin/announcements/${announcementId}`,
    ...options,
  })
}
