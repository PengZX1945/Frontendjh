<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import AdminItemRow from '@/components/admin-item-row.vue'
import AdminTabs from '@/components/admin-tabs.vue'
import EmptyState from '@/components/empty-state.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import { closeItemByAdmin, deleteItem, fetchAllItems } from '@/api/item-api'
import {
  itemCategoryOptions,
  itemStatusMeta,
  itemStatusOptions,
  itemTypeMeta,
  itemTypeOptions,
} from '@/constants/domain'
import { usePagedRecords } from '@/composables/use-paged-records'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import type { ItemRecord, ItemStatus, ItemType } from '@/types/item'

/** 全校总览（系统管理员）：可按类型、状态、分类、关键词过滤，支持线下确认后关闭 */
const overviewPageSize = 10

const typeFilter = ref<ItemType | ''>('')
const statusFilter = ref<ItemStatus | ''>('')
const categoryFilter = ref('')
const keywordFilter = ref('')
const keywordDraft = ref('')
let keywordTimer: number | undefined

const {
  records,
  hasMore,
  isInitialLoading,
  isLoadingMore,
  errorMessage,
  loadNextPage,
  refresh,
  removeRecord,
} = usePagedRecords<ItemRecord>((page) =>
  fetchAllItems({
    type: typeFilter.value === '' ? undefined : typeFilter.value,
    status: statusFilter.value === '' ? undefined : statusFilter.value,
    category: categoryFilter.value,
    keyword: keywordFilter.value,
    page,
    pageSize: overviewPageSize,
  }),
)

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

const hasFilter = computed(
  () =>
    typeFilter.value !== '' ||
    statusFilter.value !== '' ||
    categoryFilter.value !== '' ||
    keywordFilter.value !== '',
)

function toggleTypeFilter(nextType: ItemType | ''): void {
  typeFilter.value = typeFilter.value === nextType ? '' : nextType
}

function toggleStatusFilter(nextStatus: ItemStatus | ''): void {
  statusFilter.value = statusFilter.value === nextStatus ? '' : nextStatus
}

function scheduleKeywordSearch(): void {
  window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => {
    keywordFilter.value = keywordDraft.value.trim()
  }, 350)
}

function clearFilters(): void {
  typeFilter.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
  keywordFilter.value = ''
  keywordDraft.value = ''
}

async function handleClose(item: ItemRecord): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '关闭该记录',
    message: `将「${item.itemName}」的状态置为「已关闭」。适用于线下已确认交接完成的情况。确定关闭？`,
    confirmText: '关闭记录',
  })
  if (!isConfirmed) return

  try {
    await closeItemByAdmin(item.itemId, { silent: true })
    showSuccessToast('状态已更新为已关闭')
    await refresh()
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  }
}

async function handleDelete(item: ItemRecord): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '删除该记录',
    message: `「${item.itemName}」删除后无法恢复，相关认领申请会失去关联。确定删除？`,
    confirmText: '删除',
    danger: true,
  })
  if (!isConfirmed) return

  try {
    await deleteItem(item.itemId, { silent: true })
    removeRecord((record) => record.itemId === item.itemId)
    showSuccessToast('已删除')
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  }
}

watch(
  [typeFilter, statusFilter, categoryFilter, keywordFilter],
  () => {
    void refresh()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.clearTimeout(keywordTimer)
})
</script>

<template>
  <div class="admin-items page-section">
    <div class="content-container">
      <header class="admin-items__header">
        <p class="eyebrow">管理台</p>
        <h1 class="section-title">全校总览</h1>
        <p class="lead">含待审核、已驳回、已关闭在内的全部记录，可在此完成收尾处理。</p>
      </header>

      <AdminTabs />

      <div class="admin-items__filters surface-card">
        <div class="admin-items__search">
          <input
            v-model="keywordDraft"
            class="input"
            type="search"
            placeholder="搜索物品名称或描述…"
            @input="scheduleKeywordSearch"
          />
          <select v-model="categoryFilter" class="select">
            <option value="">全部分类</option>
            <option v-for="option in itemCategoryOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <div class="admin-items__chips">
          <span class="admin-items__chip-label">类型</span>
          <button
            v-for="option in itemTypeOptions"
            :key="option"
            type="button"
            class="chip"
            :class="{ 'chip--active': typeFilter === option }"
            @click="toggleTypeFilter(option)"
          >
            {{ itemTypeMeta[option].label }}
          </button>
        </div>

        <div class="admin-items__chips">
          <span class="admin-items__chip-label">状态</span>
          <button
            v-for="option in itemStatusOptions"
            :key="option"
            type="button"
            class="chip"
            :class="{ 'chip--active': statusFilter === option }"
            @click="toggleStatusFilter(option)"
          >
            {{ itemStatusMeta[option].label }}
          </button>
        </div>

        <button
          v-if="hasFilter"
          type="button"
          class="btn btn--small btn--ghost"
          @click="clearFilters"
        >
          清空筛选
        </button>
      </div>

      <div v-if="isInitialLoading" class="admin-items__list">
        <div v-for="index in 3" :key="index" class="skeleton admin-items__skeleton"></div>
      </div>

      <div v-else-if="records.length > 0" class="admin-items__list">
        <AdminItemRow
          v-for="item in records"
          :key="item.itemId"
          :item="item"
          :show-reject-reason="true"
        >
          <template #actions>
            <RouterLink
              class="btn btn--small btn--ghost"
              :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }"
            >
              详情
            </RouterLink>
            <button
              v-if="item.itemStatus !== 3"
              type="button"
              class="btn btn--small btn--quiet"
              @click="handleClose(item)"
            >
              置为已关闭
            </button>
            <button type="button" class="btn btn--small btn--danger" @click="handleDelete(item)">
              删除
            </button>
          </template>
        </AdminItemRow>
      </div>

      <EmptyState
        v-else-if="errorMessage === ''"
        title="没有符合条件的记录"
        :message="hasFilter ? '换一组筛选条件试试，或清空筛选。' : '系统里还没有任何物品记录。'"
      >
        <button v-if="hasFilter" type="button" class="btn btn--quiet" @click="clearFilters">
          清空筛选
        </button>
      </EmptyState>

      <EmptyState v-else title="这次没能取到数据" :message="errorMessage">
        <button type="button" class="btn btn--primary" @click="refresh()">重新加载</button>
      </EmptyState>

      <InfiniteSentinel
        v-if="records.length > 0"
        :disabled="isSentinelDisabled"
        @reach="loadNextPage"
      />
      <LoadMoreIndicator
        v-if="records.length > 0"
        :is-loading="isLoadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
        empty-hint="已列出全部记录"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-items__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.admin-items__filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
}

.admin-items__search {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.admin-items__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.admin-items__chip-label {
  min-width: 32px;
  color: var(--ink-tertiary);
  font-size: 13px;
}

.admin-items__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-items__skeleton {
  height: 156px;
  border-radius: var(--radius-lg);
}

@media (max-width: 720px) {
  .admin-items__search {
    grid-template-columns: 1fr;
  }
}
</style>
