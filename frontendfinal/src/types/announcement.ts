/** 公告状态：0 公开 / 1 已下线 */
export type AnnouncementStatus = 0 | 1

/** 公告记录 */
export interface AnnouncementRecord {
  announcementId: number
  title: string
  content: string
  announcementStatus: AnnouncementStatus
  createdTime: string
}

/** 公告发布 / 修改请求体 */
export interface AnnouncementPayload {
  title: string
  content: string
}

/** 公告分页查询参数 */
export interface AnnouncementQueryParams {
  page?: number
  pageSize?: number
}
