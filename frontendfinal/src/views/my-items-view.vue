<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import EmptyState from '@/components/empty-state.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import ItemManageRow from '@/components/item-manage-row.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import { closeItemClaim, deleteItem, fetchMyItems } from '@/api/item-api'
import {
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

/** 我的发布：跨全部状态（含待审核与驳回理由） */
const myPageSize = 10

const typeFilter = ref<ItemType | ''>('')
const statusFilter = ref<ItemStatus | ''>('')

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
  fetchMyItems({
    type: typeFilter.value === '' ? undefined : typeFilter.value,
    itemStatus: statusFilter.value === '' ? undefined : statusFilter.value,
    page,
    pageSize: myPageSize,
  }),
)

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

const hasFilter = computed(() => typeFilter.value !== '' || statusFilter.value !== '')

function toggleTypeFilter(nextType: ItemType | ''): void {
  typeFilter.value = typeFilter.value === nextType ? '' : nextType
}

function toggleStatusFilter(nextStatus: ItemStatus | ''): void {
  statusFilter.value = statusFilter.value === nextStatus ? '' : nextStatus
}

function clearFilters(): void {
  typeFilter.value = ''
  statusFilter.value = ''
}

async function handleRemove(item: ItemRecord): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '删除这条信息',
    message: `「${item.itemName}」删除后无法恢复。确定删除？`,
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

async function handleCloseClaim(item: ItemRecord): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '关闭认领通道',
    message: '关闭后其他人将无法再申请认领。确定关闭？',
    confirmText: '关闭认领',
    danger: true,
  })
  if (!isConfirmed) return

  try {
    await closeItemClaim(item.itemId, { silent: true })
    showSuccessToast('认领通道已关闭')
    await refresh()
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  }
}

watch(
  [typeFilter, statusFilter],
  () => {
    void refresh()
  },
  { immediate: true },
)
</script>

<template>
  <div class="my-items page-section">
    <div class="content-container">
      <header class="my-items__header">
        <p class="eyebrow">我的</p>
        <h1 class="section-title">我的发布</h1>
        <p class="lead">这里能看到全部状态的记录，包括还在审核、以及被驳回的条目与理由。</p>
      </header>

      <div class="my-items__filters">
        <div class="my-items__filter-group">
          <span class="my-items__filter-label">类型</span>
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

        <div class="my-items__filter-group">
          <span class="my-items__filter-label">状态</span>
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
      </div>

      <div v-if="isInitialLoading" class="my-items__list">
        <div v-for="index in 4" :key="index" class="my-items__skeleton">
          <div class="skeleton my-items__skeleton-media"></div>
          <div class="my-items__skeleton-body">
            <div class="skeleton my-items__skeleton-line"></div>
            <div class="skeleton my-items__skeleton-line my-items__skeleton-line--short"></div>
          </div>
        </div>
      </div>

      <div v-else-if="records.length > 0" class="my-items__list">
        <ItemManageRow
          v-for="item in records"
          :key="item.itemId"
          :item="item"
          @remove="handleRemove(item)"
          @close-claim="handleCloseClaim(item)"
        />
      </div>

      <EmptyState
        v-else-if="errorMessage === ''"
        :title="hasFilter ? '没有符合筛选条件的记录' : '你还没有发布过信息'"
        :message="
          hasFilter
            ? '换一组筛选条件看看，或者清空筛选。'
            : '丢了东西或捡到东西，都可以发一条 —— 审核通过后就会出现在信息流里。'
        "
      >
        <button v-if="hasFilter" type="button" class="btn btn--quiet" @click="clearFilters">
          清空筛选
        </button>
        <RouterLink
          v-else
          class="btn btn--primary"
          :to="{ name: 'itemPublish', query: { type: 'lost' } }"
        >
          去发布
        </RouterLink>
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
        empty-hint="已列出全部发布"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

<style scoped>
.my-items__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.my-items__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.my-items__filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.my-items__filter-label {
  margin-right: var(--space-1);
  color: var(--ink-tertiary);
  font-size: 13px;
}

.my-items__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.my-items__skeleton {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: 88px 1fr;
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
}

.my-items__skeleton-media {
  width: 88px;
  height: 88px;
}

.my-items__skeleton-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-1);
}

.my-items__skeleton-line {
  height: 14px;
  width: 40%;
}

.my-items__skeleton-line--short {
  width: 24%;
}
</style>
