/**
 * 认领申请相关接口：提交申请、我的申请、管理员列表与审批。
 */
import { req } from './request';
import type { ApiResponse, Claim } from './itemMeta';

function pickClaims(data: unknown): Claim[] {
  if (Array.isArray(data)) return data as Claim[];
  if (data && typeof data === 'object') {
    const box = data as { claims?: Claim[]; list?: Claim[]; records?: Claim[] };
    return box.claims ?? box.list ?? box.records ?? [];
  }
  return [];
}

/** 提交认领申请：POST /api/claims?item_id=，body { reason } */
export async function submitClaim(
  itemId: number,
  reason: string,
): Promise<ApiResponse<null>> {
  return req.post('/claims/', { reason }, { params: { item_id: itemId } }) as unknown as Promise<ApiResponse<null>>;
}

/** 我的认领申请：GET /api/my/claims/ */
export async function fetchMyClaims(params: { claim_status?: number; page?: number; page_size?: number } = {}): Promise<ApiResponse<Claim[]>> {
  const res = (await req.get('/my/claims/', { params })) as unknown as ApiResponse<unknown>;
  return { ...res, data: pickClaims(res?.data) };
}

/** 管理员认领申请列表：GET /api/admin/claims */
export async function fetchAdminClaims(params: { claim_status?: number; page?: number; page_size?: number } = {}): Promise<ApiResponse<Claim[]>> {
  const res = (await req.get('/admin/claims', { params })) as unknown as ApiResponse<unknown>;
  return { ...res, data: pickClaims(res?.data) };
}

/** 审批认领申请：POST /api/admin/claims/:claim_id/:option（approve | reject） */
export async function reviewClaim(claimId: number, option: 'approve' | 'reject'): Promise<ApiResponse<null>> {
  return req.post(`/admin/claims/${claimId}/${option}`) as unknown as Promise<ApiResponse<null>>;
}

/** 认领申请详情：GET /api/claims/:claim_id（仅申请人本人或管理员） */
export async function fetchClaimDetail(claimId: number): Promise<ApiResponse<Claim>> {
  return req.get(`/claims/${claimId}`) as unknown as Promise<ApiResponse<Claim>>;
}

/** 修改认领申请（理由 / 联系方式）：PUT /api/claims/:claim_id（仅申请人本人、待审批状态） */
export async function updateClaim(claimId: number, reason: string, applicantContact: string): Promise<ApiResponse<null>> {
  return req.put(`/claims/${claimId}`, { reason, applicant_contact: applicantContact }) as unknown as Promise<ApiResponse<null>>;
}

/** 删除认领申请：DELETE /api/claims/:claim_id/（申请人本人或系统管理员） */
export async function deleteClaim(claimId: number): Promise<ApiResponse<null>> {
  return req.delete(`/claims/${claimId}/`) as unknown as Promise<ApiResponse<null>>;
}
