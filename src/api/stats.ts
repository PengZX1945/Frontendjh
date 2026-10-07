/**
 * 管理员统计：全校发布趋势 + 各项统计。
 */
import { req } from './request';
import type { ApiResponse } from './itemMeta';

export interface TrendPoint {
  date: string;
  total: number;
  found: number;
  lost: number;
}

export interface OverviewStats {
  items_total: number;
  found_total: number;
  lost_total: number;
  users_total: number;
  announcements_total: number;
  claims_total: number;
  status_stats: Array<{ status: number; count: number }>;
  item_type_stats: Array<{ status: number; count: number }>;
  claim_status_stats: Array<{ status: number; count: number }> | null;
}

/** 管理员：GET /api/admin/stats/overview 各项统计 */
export async function fetchOverview(): Promise<ApiResponse<OverviewStats>> {
  return req.get('/admin/stats/overview') as unknown as Promise<ApiResponse<OverviewStats>>;
}

/** 管理员：GET /api/admin/stats/trend 发布趋势 */
export async function fetchTrend(days = 30): Promise<ApiResponse<{ days: TrendPoint[] }>> {
  return req.get('/admin/stats/trend', { params: { days } }) as unknown as Promise<ApiResponse<{ days: TrendPoint[] }>>;
}
