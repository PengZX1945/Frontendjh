import type { ClaimDetail, ClaimRecord, ClaimStatus } from '@/types/claim'
import { isRecord, toNumber, toText } from '@/utils/type-guards'
import { normalizeItemRecord } from '@/utils/item-normalizers'

/** 认领状态收敛：只接受 0–3，其余按「待审批」处理 */
export function normalizeClaimStatus(value: unknown): ClaimStatus {
  const status = toNumber(value)
  if (status === 1 || status === 2 || status === 3) return status
  return 0
}

/** 归一化认领申请行（列表用） */
export function normalizeClaimRecord(raw: unknown): ClaimRecord {
  const record = isRecord(raw) ? raw : {}
  return {
    claimId: toNumber(record.claim_id ?? record.claimId ?? record.id),
    itemId: toNumber(record.item_id ?? record.itemId),
    reason: toText(record.reason),
    applicantContact: toText(record.applicant_contact ?? record.applicantContact ?? record.contact),
    createdTime: toText(record.created_time ?? record.createdTime),
    lastEditTime: toText(record.last_edit_time ?? record.lastEditTime),
    claimStatus: normalizeClaimStatus(record.claim_status ?? record.claimStatus ?? record.status),
    applicantId: toNumber(record.applicant_id ?? record.applicantId ?? record.user_id),
  }
}

/** 批量归一化申请列表 */
export function normalizeClaimList(raw: unknown): ClaimRecord[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => normalizeClaimRecord(entry))
}

/**
 * 归一化申请详情。
 * 详情里内联了对应物品（`item`），单独走物品归一化；物品可能已被删除，故允许 null。
 */
export function normalizeClaimDetail(raw: unknown): ClaimDetail | null {
  if (!isRecord(raw)) return null
  const itemRaw = raw.item
  return {
    claimId: toNumber(raw.claim_id ?? raw.claimId ?? raw.id),
    item: isRecord(itemRaw) ? normalizeItemRecord(itemRaw) : null,
    reason: toText(raw.reason),
    contact: toText(raw.contact ?? raw.applicant_contact),
    createdTime: toText(raw.created_time ?? raw.createdTime),
    lastEditTime: toText(raw.last_edit_time ?? raw.lastEditTime),
    claimStatus: normalizeClaimStatus(raw.claim_status ?? raw.claimStatus ?? raw.status),
    userId: toNumber(raw.user_id ?? raw.userId ?? raw.applicant_id),
  }
}
