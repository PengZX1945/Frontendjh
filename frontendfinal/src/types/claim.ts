import type { ItemRecord } from '@/types/item'

/** 认领申请状态：0 待审批 / 1 已通过 / 2 已驳回 / 3 已取消 */
export type ClaimStatus = 0 | 1 | 2 | 3

/** 认领申请记录：`GET /api/admin/claims` 与 `/api/my/claims/` 的行 */
export interface ClaimRecord {
  claimId: number
  itemId: number
  reason: string
  applicantContact: string
  createdTime: string
  lastEditTime: string
  claimStatus: ClaimStatus
  applicantId: number
}

/** 申请详情：`GET /api/claims/{claim_id}`，在申请之上内联了对应物品 */
export interface ClaimDetail {
  claimId: number
  item: ItemRecord | null
  reason: string
  contact: string
  createdTime: string
  lastEditTime: string
  claimStatus: ClaimStatus
  userId: number
}

/** `POST /api/claims` 请求体（item_id 走 query） */
export interface ClaimSubmitPayload {
  reason: string
}

/** `PUT /api/claims/{claim_id}` 请求体 */
export interface ClaimChangePayload {
  reason: string
  applicantContact: string
}

/** 认领申请的查询参数 */
export interface ClaimQueryParams {
  claimStatus?: ClaimStatus
  page?: number
  pageSize?: number
}

/** 审批动作：通过 / 驳回 */
export type ClaimReviewOption = 'approve' | 'reject'
