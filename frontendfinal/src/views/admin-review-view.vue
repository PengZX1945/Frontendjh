<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AdminItemRow from '@/components/admin-item-row.vue'
import AdminTabs from '@/components/admin-tabs.vue'
import EmptyState from '@/components/empty-state.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import { fetchPendingItems, reviewItem } from '@/api/item-api'
import { itemTypeMeta, itemTypeOptions } from '@/constants/domain'
import { usePagedRecords } from '@/composables/use-paged-records'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import type { ItemRecord, ItemType } from '@/types/item'

/** 发布审核台：只列「待审核」，通过后进入信息流，驳回需填理由 */
const reviewPageSize = 10

const reviewType = ref<ItemType>('lost')
const busyItemId = ref<number | null>(null)
const rejectTargetId = ref<number | null>(null)
const rejectReason = ref('')
const rejectError = ref('')

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
  fetchPendingItems(reviewType.value, { page, pageSize: reviewPageSize }),
)

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

function switchType(nextType: ItemType): void {
  if (reviewType.value === nextType) return
  reviewType.value = nextType
  rejectTargetId.value = null
  rejectReason.value = ''
}

function openRejectForm(item: ItemRecord): void {
  rejectTargetId.value = item.itemId
  rejectReason.value = ''
  rejectError.value = ''
}

function cancelReject(): void {
  rejectTargetId.value = null
  rejectReason.value = ''
  rejectError.value = ''
}

async function handleApprove(item: ItemRecord): Promise<void> {
  busyItemId.value = item.itemId
  try {
    await reviewItem(item.itemId, 'approve', '', { silent: true })
    removeRecord((record) => record.itemId === item.itemId)
    showSuccessToast('已通过，信息已进入公开列表')
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  } finally {
    busyItemId.value = null
  }
}

async function handleReject(item: ItemRecord): Promise<void> {
  const reason = rejectReason.value.trim()
  if (reason === '') {
    rejectError.value = '请填写驳回理由'
    return
  }

  busyItemId.value = item.itemId
  try {
    await reviewItem(item.itemId, 'reject', reason, { silent: true })
    removeRecord((record) => record.itemId === item.itemId)
    cancelReject()
    showSuccessToast('已驳回')
  } catch (error) {
    rejectError.value = resolveErrorMessage(error)
  } finally {
    busyItemId.value = null
  }
}

watch(
  reviewType,
  () => {
    void refresh()
  },
  { immediate: true },
)
</script>

<template>
  <div class="admin-review page-section">
    <div class="content-container">
      <header class="admin-review__header">
        <p class="eyebrow">管理台</p>
        <h1 class="section-title">发布审核</h1>
        <p class="lead">待审核的发布都汇总在这里，通过后立即出现在对应频道的信息流中。</p>
      </header>

      <AdminTabs />

      <div class="admin-review__filters">
        <button
          v-for="option in itemTypeOptions"
          :key="option"
          type="button"
          class="chip"
          :class="{ 'chip--active': reviewType === option }"
          @click="switchType(option)"
        >
          {{ itemTypeMeta[option].label }}
        </button>
      </div>

      <div v-if="isInitialLoading" class="admin-review__list">
        <div v-for="index in 3" :key="index" class="skeleton admin-review__skeleton"></div>
      </div>

      <div v-else-if="records.length > 0" class="admin-review__list">
        <AdminItemRow v-for="item in records" :key="item.itemId" :item="item">
          <template #actions>
            <button
              type="button"
              class="btn btn--small btn--primary"
              :disabled="busyItemId === item.itemId"
              @click="handleApprove(item)"
            >
              通过
            </button>
            <button
              type="button"
              class="btn btn--small btn--danger"
              :disabled="busyItemId === item.itemId"
              @click="openRejectForm(item)"
            >
              驳回
            </button>
            <RouterLink
              class="btn btn--small btn--ghost"
              :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }"
            >
              详情
            </RouterLink>
          </template>

          <form
            v-if="rejectTargetId === item.itemId"
            class="admin-review__reject"
            @submit.prevent="handleReject(item)"
          >
            <label class="field">
              <span class="field__label field__label-required">驳回理由</span>
              <textarea
                v-model="rejectReason"
                class="textarea"
                :class="{ 'textarea--invalid': rejectError !== '' }"
                rows="3"
                placeholder="例如：缺少物品特征描述，请补充颜色与品牌后再提交。"
              ></textarea>
            </label>
            <p v-if="rejectError !== ''" class="field__error">{{ rejectError }}</p>
            <div class="admin-review__reject-actions">
              <button type="button" class="btn btn--small btn--ghost" @click="cancelReject">
                取消
              </button>
              <button
                type="submit"
                class="btn btn--small btn--primary"
                :disabled="busyItemId === item.itemId"
              >
                确认驳回
              </button>
            </div>
          </form>
        </AdminItemRow>
      </div>

      <EmptyState
        v-else-if="errorMessage === ''"
        title="没有待审核的发布"
        :message="`${itemTypeMeta[reviewType].label}目前都处理完了，有新的提交会出现在这里。`"
      />

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
        empty-hint="待审核队列已全部列出"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-review__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.admin-review__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.admin-review__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-review__skeleton {
  height: 148px;
  border-radius: var(--radius-lg);
}

.admin-review__reject {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  margin: var(--space-2) 0 var(--space-3);
}

.admin-review__reject-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
