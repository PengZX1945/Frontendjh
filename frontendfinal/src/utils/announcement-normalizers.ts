import type { AnnouncementRecord, AnnouncementStatus } from '@/types/announcement'
import { isRecord, toNumber, toText } from '@/utils/type-guards'

/** 公告状态收敛：只认 0 / 1，其余按「公开」处理 */
export function normalizeAnnouncementStatus(value: unknown): AnnouncementStatus {
  return toNumber(value) === 1 ? 1 : 0
}

/** 归一化公告记录 */
export function normalizeAnnouncementRecord(raw: unknown): AnnouncementRecord {
  const record = isRecord(raw) ? raw : {}
  return {
    announcementId: toNumber(record.announcement_id ?? record.announcementId ?? record.id),
    title: toText(record.title),
    content: toText(record.content),
    announcementStatus: normalizeAnnouncementStatus(
      record.announcement_status ?? record.announcementStatus ?? record.status,
    ),
    createdTime: toText(record.created_time ?? record.createdTime),
  }
}

/** 批量归一化公告列表 */
export function normalizeAnnouncementList(raw: unknown): AnnouncementRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => normalizeAnnouncementRecord(entry))
}
