import { request, sendRequest } from '@/api/http'
import { defaultPageSize } from '@/constants/domain'
import { buildPagedResult } from '@/utils/paged-result'
import { normalizeClaimDetail, normalizeClaimList } from '@/utils/claim-normalizers'
import { readRecordList } from '@/utils/type-guards'
import type { ApiRequestOptions, PagedResult } from '@/types/api'
import type {
  ClaimChangePayload,
  ClaimDetail,
  ClaimQueryParams,
  ClaimRecord,
  ClaimReviewOption,
  ClaimSubmitPayload,
} from '@/types/claim'

/** `GET /api/admin/claims` — 认领申请列表（finder_admin 及以上） */
export async function fetchClaimList(
  params: ClaimQueryParams = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<ClaimRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: '/admin/claims',
    params: { claim_status: params.claimStatus, page: params.page, page_size: pageSize },
    ...options,
  })

  const records = normalizeClaimList(readRecordList(rawResponse.body, ['claims']))
  return buildPagedResult(records, pageSize)
}

/** `GET /api/my/claims/` — 我的认领申请（仅本人） */
export async function fetchMyClaims(
  params: ClaimQueryParams = {},
  options: ApiRequestOptions = {},
): Promise<PagedResult<ClaimRecord>> {
  const pageSize = params.pageSize ?? defaultPageSize
  const rawResponse = await sendRequest({
    method: 'get',
    url: '/my/claims/',
    params: { claim_status: params.claimStatus, page: params.page, page_size: pageSize },
    ...options,
  })

  const records = normalizeClaimList(readRecordList(rawResponse.body, ['claims']))
  return buildPagedResult(records, pageSize)
}

/** `GET /api/claims/{claim_id}` — 申请详情（普通用户仅限自己的申请） */
export async function fetchClaimDetail(
  claimId: number,
  options: ApiRequestOptions = {},
): Promise<ClaimDetail | null> {
  const rawBody = await request<unknown>({ method: 'get', url: `/claims/${claimId}`, ...options })
  return normalizeClaimDetail(rawBody)
}

/** `PUT /api/claims/{claim_id}` — 修改申请理由与联系方式 */
export async function updateClaim(
  claimId: number,
  payload: ClaimChangePayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'put',
    url: `/claims/${claimId}`,
    data: { reason: payload.reason, applicant_contact: payload.applicantContact },
    ...options,
  })
}

/**
 * `POST /api/claims?item_id=` — 提交认领申请。
 * 只能对 `type=found && status=1` 的帖子申请；申请自己的帖子返回 7，重复申请返回 9。
 */
export async function submitClaim(
  itemId: number,
  payload: ClaimSubmitPayload,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'post',
    url: '/claims',
    params: { item_id: itemId },
    data: { reason: payload.reason },
    ...options,
  })
}

/**
 * `POST /api/admin/claims/{claim_id}/{option}` — 审批（finder_admin 及以上）。
 * 审批通过后物品状态自动变化，同物品的其他申请被自动驳回。
 */
export async function reviewClaim(
  claimId: number,
  option: ClaimReviewOption,
  options: ApiRequestOptions = {},
): Promise<void> {
  await request<void>({
    method: 'post',
    url: `/admin/claims/${claimId}/${option}`,
    ...options,
  })
}

/** `DELETE /api/claims/{claim_id}/` — 取消 / 删除申请（本人，或 sys_admin 删任意） */
export async function deleteClaim(claimId: number, options: ApiRequestOptions = {}): Promise<void> {
  await request<void>({ method: 'delete', url: `/claims/${claimId}/`, ...options })
}
