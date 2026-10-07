<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import EmptyState from '@/components/empty-state.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import StatusPill from '@/components/status-pill.vue'
import { deleteClaim, fetchMyClaims } from '@/api/claim-api'
import { claimStatusMeta, claimStatusOptions } from '@/constants/domain'
import { usePagedRecords } from '@/composables/use-paged-records'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { formatRelativeTime } from '@/utils/date-format'
import type { ClaimRecord, ClaimStatus } from '@/types/claim'

/** 我的认领申请：可按状态筛选，待审批的可以取消 */
const myClaimPageSize = 10

const statusFilter = ref<ClaimStatus | ''>('')

const {
  records,
  hasMore,
  isInitialLoading,
  isLoadingMore,
  errorMessage,
  loadNextPage,
  refresh,
  removeRecord,
} = usePagedRecords<ClaimRecord>((page) =>
  fetchMyClaims({
    claimStatus: statusFilter.value === '' ? undefined : statusFilter.value,
    page,
    pageSize: myClaimPageSize,
  }),
)

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

function toggleStatusFilter(nextStatus: ClaimStatus | ''): void {
  statusFilter.value = statusFilter.value === nextStatus ? '' : nextStatus
}

function canCancel(claim: ClaimRecord): boolean {
  return claim.claimStatus === 0
}

async function handleCancel(claim: ClaimRecord): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '取消认领申请',
    message: '取消后可以重新提交，但需要管理员再次审批。确定取消这条申请？',
    confirmText: '取消申请',
    danger: true,
  })
  if (!isConfirmed) return

  try {
    await deleteClaim(claim.claimId, { silent: true })
    removeRecord((record) => record.claimId === claim.claimId)
    showSuccessToast('申请已取消')
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  }
}

watch(
  statusFilter,
  () => {
    void refresh()
  },
  { immediate: true },
)
</script>

<template>
  <div class="my-claims page-section">
    <div class="content-container">
      <header class="my-claims__header">
        <p class="eyebrow">我的</p>
        <h1 class="section-title">我的认领</h1>
        <p class="lead">提交过的认领申请都在这里，通过后管理员会与你联系交接。</p>
      </header>

      <div class="my-claims__filters">
        <button
          type="button"
          class="chip"
          :class="{ 'chip--active': statusFilter === '' }"
          @click="toggleStatusFilter('')"
        >
          全部
        </button>
        <button
          v-for="option in claimStatusOptions"
          :key="option"
          type="button"
          class="chip"
          :class="{ 'chip--active': statusFilter === option }"
          @click="toggleStatusFilter(option)"
        >
          {{ claimStatusMeta[option].label }}
        </button>
      </div>

      <div v-if="isInitialLoading" class="my-claims__list">
        <div v-for="index in 3" :key="index" class="claim-row">
          <div class="skeleton claim-row__skeleton-title"></div>
          <div class="skeleton claim-row__skeleton-line"></div>
        </div>
      </div>

      <div v-else-if="records.length > 0" class="my-claims__list">
        <article v-for="claim in records" :key="claim.claimId" class="claim-row">
          <div class="claim-row__main">
            <div class="claim-row__head">
              <StatusPill
                :label="claimStatusMeta[claim.claimStatus].label"
                :tone="claimStatusMeta[claim.claimStatus].tone"
              />
              <span class="claim-row__id">申请编号 #{{ claim.claimId }}</span>
            </div>

            <p class="claim-row__reason">{{ claim.reason }}</p>

            <p class="claim-row__meta">
              <span>物品编号 #{{ claim.itemId }}</span>
              <span>· {{ formatRelativeTime(claim.createdTime) }}</span>
            </p>
          </div>

          <div class="claim-row__actions">
            <RouterLink
              class="btn btn--small btn--quiet"
              :to="{ name: 'claimDetail', params: { claimId: String(claim.claimId) } }"
            >
              申请详情
            </RouterLink>
            <RouterLink
              class="btn btn--small btn--ghost"
              :to="{ name: 'itemDetail', params: { itemId: String(claim.itemId) } }"
            >
              对应物品
            </RouterLink>
            <button
              v-if="canCancel(claim)"
              type="button"
              class="btn btn--small btn--danger"
              @click="handleCancel(claim)"
            >
              取消申请
            </button>
          </div>
        </article>
      </div>

      <EmptyState
        v-else-if="errorMessage === ''"
        title="还没有认领申请"
        message="在失物招领里看到自己丢失的东西，可以在详情页提交认领申请。"
      >
        <RouterLink class="btn btn--primary" :to="{ name: 'itemFeed', params: { type: 'found' } }">
          去看看失物招领
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
        empty-hint="已列出全部申请"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

<style scoped>
.my-claims__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.my-claims__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.my-claims__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.claim-row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
}

.claim-row__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.claim-row__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.claim-row__id {
  color: var(--ink-tertiary);
  font-size: 12px;
}

.claim-row__reason {
  font-size: 15px;
  line-height: 1.55;
}

.claim-row__meta {
  display: flex;
  gap: 6px;
  color: var(--ink-tertiary);
  font-size: 13px;
}

.claim-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}

.claim-row__skeleton-title {
  height: 20px;
  width: 160px;
}

.claim-row__skeleton-line {
  height: 14px;
  width: 60%;
}

@media (max-width: 720px) {
  .claim-row {
    grid-template-columns: 1fr;
  }

  .claim-row__actions {
    justify-content: flex-start;
  }
}
</style>
