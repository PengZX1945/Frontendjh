import type { PagedResult } from '@/types/api'

/**
 * 组装分页结果。
 *
 * 接口文档的分页响应只给记录数组、不给总数，所以「是否还有下一页」按
 * 「本页条数是否装满 pageSize」推断；装满就继续加载，装不满即到末页。
 * 若后端将来补上 `total` / `total_page`，只需改这一个函数。
 */
export function buildPagedResult<TRecord>(
  records: TRecord[],
  pageSize: number,
): PagedResult<TRecord> {
  return {
    records,
    hasMore: records.length >= pageSize,
  }
}
