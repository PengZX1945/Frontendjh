import { ref, shallowRef, type Ref } from 'vue'
import type { PagedResult } from '@/types/api'
import { resolveErrorMessage } from '@/utils/error-message'

/** 单页加载器：给定页码返回一页记录 */
export type PagedLoader<TRecord> = (page: number) => Promise<PagedResult<TRecord>>

export interface PagedRecords<TRecord> {
  records: Ref<TRecord[]>
  currentPage: Ref<number>
  hasMore: Ref<boolean>
  isInitialLoading: Ref<boolean>
  isLoadingMore: Ref<boolean>
  errorMessage: Ref<string>
  loadNextPage: () => Promise<void>
  refresh: () => Promise<void>
  removeRecord: (predicate: (record: TRecord) => boolean) => void
}

/**
 * 「加载更多」式的分页取数。
 *
 * 信息流与各列表页共用：首页给出骨架屏，后续页给出底部加载指示，
 * 失败时把文案留在 `errorMessage` 由页面展示，并停止继续自动加载。
 */
export function usePagedRecords<TRecord>(loader: PagedLoader<TRecord>): PagedRecords<TRecord> {
  const records = shallowRef<TRecord[]>([])
  const currentPage = ref(0)
  const hasMore = ref(true)
  const isInitialLoading = ref(false)
  const isLoadingMore = ref(false)
  const errorMessage = ref('')

  async function loadNextPage(): Promise<void> {
    if (isInitialLoading.value || isLoadingMore.value || !hasMore.value) return

    const isFirstPage = currentPage.value === 0
    if (isFirstPage) isInitialLoading.value = true
    else isLoadingMore.value = true
    errorMessage.value = ''

    try {
      const nextPage = currentPage.value + 1
      const pageResult = await loader(nextPage)
      currentPage.value = nextPage
      records.value = isFirstPage ? pageResult.records : [...records.value, ...pageResult.records]
      // 空页也视为末页，避免后端在边界情况下让前端无限空转
      hasMore.value = pageResult.hasMore && pageResult.records.length > 0
    } catch (error) {
      errorMessage.value = resolveErrorMessage(error)
      hasMore.value = false
    } finally {
      isInitialLoading.value = false
      isLoadingMore.value = false
    }
  }

  /** 换筛选条件时重来一遍 */
  async function refresh(): Promise<void> {
    currentPage.value = 0
    hasMore.value = true
    records.value = []
    errorMessage.value = ''
    await loadNextPage()
  }

  /** 本地删除某条记录（删除成功后无需整页重拉） */
  function removeRecord(predicate: (record: TRecord) => boolean): void {
    records.value = records.value.filter((record) => !predicate(record))
  }

  return {
    records,
    currentPage,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    loadNextPage,
    refresh,
    removeRecord,
  }
}
