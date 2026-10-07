<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AdminTabs from '@/components/admin-tabs.vue'
import EmptyState from '@/components/empty-state.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import StatusPill from '@/components/status-pill.vue'
import { fetchClaimList, reviewClaim } from '@/api/claim-api'
import { claimStatusMeta, claimStatusOptions } from '@/constants/domain'
import { usePagedRecords } from '@/composables/use-paged-records'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { formatDateTime, formatRelativeTime } from '@/utils/date-format'
import type { ClaimRecord, ClaimStatus } from '@/types/claim'

/**
 * 认领审批台。
 * 接口约定：审批只对 `status=0` 的申请有效，通过后对应物品状态自动变化，
 * 同物品的其他申请会被后端自动驳回 —— 因此审批后整页刷新一次，拿到最新状态。
 */
const claimPageSize = 10

const statusFilter = ref<ClaimStatus>(0)
const busyClaimId = ref<number | null>(null)

const { records, hasMore, isInitialLoading, isLoadingMore, errorMessage, loadNextPage, refresh } =
  usePagedRecords<ClaimRecord>((page) =>
    fetchClaimList({ claimStatus: statusFilter.value, page, pageSize: claimPageSize }),
  )

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

function switchStatusFilter(nextStatus: ClaimStatus): void {
  if (statusFilter.value === nextStatus) return
  statusFilter.value = nextStatus
}

async function handleReview(claim: ClaimRecord, option: 'approve' | 'reject'): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: option === 'approve' ? '通过认领申请' : '驳回认领申请',
    message:
      option === 'approve'
        ? '通过后物品状态会更新为已认领，同物品的其他申请将被自动驳回。确定通过？'
        : '驳回后申请人会看到该结果。确定驳回？',
    confirmText: option === 'approve' ? '通过' : '驳回',
    danger: option === 'reject',
  })
  if (!isConfirmed) return

  busyClaimId.value = claim.claimId
  try {
    await reviewClaim(claim.claimId, option, { silent: true })
    showSuccessToast(option === 'approve' ? '已通过' : '已驳回')
    await refresh()
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  } finally {
    busyClaimId.value = null
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
  <div class="admin-claims page-section">
    <div class="content-container">
      <header class="admin-claims__header">
        <p class="eyebrow">管理台</p>
        <h1 class="section-title">认领审批</h1>
        <p class="lead">核对申请理由与物品特征，通过后请在线下完成物品交接。</p>
      </header>

      <AdminTabs />

      <div class="admin-claims__filters">
        <button
          v-for="option in claimStatusOptions"
          :key="option"
          type="button"
          class="chip"
          :class="{ 'chip--active': statusFilter === option }"
          @click="switchStatusFilter(option)"
        >
          {{ claimStatusMeta[option].label }}
        </button>
      </div>

      <div v-if="isInitialLoading" class="admin-claims__list">
        <div v-for="index in 3" :key="index" class="skeleton admin-claims__skeleton"></div>
      </div>

      <div v-else-if="records.length > 0" class="admin-claims__list">
        <article v-for="claim in records" :key="claim.claimId" class="admin-claim-row">
          <div class="admin-claim-row__main">
            <div class="admin-claim-row__head">
              <StatusPill
                :label="claimStatusMeta[claim.claimStatus].label"
                :tone="claimStatusMeta[claim.claimStatus].tone"
              />
              <span class="admin-claim-row__id">申请 #{{ claim.claimId }}</span>
              <span class="admin-claim-row__id">物品 #{{ claim.itemId }}</span>
            </div>

            <p class="admin-claim-row__reason">{{ claim.reason }}</p>

            <dl class="admin-claim-row__facts">
              <div>
                <dt>申请人</dt>
                <dd>#{{ claim.applicantId }}</dd>
              </div>
              <div>
                <dt>联系方式</dt>
                <dd>{{ claim.applicantContact || '未填写' }}</dd>
              </div>
              <div>
                <dt>提交于</dt>
                <dd>{{ formatDateTime(claim.createdTime) }}</dd>
              </div>
              <div>
                <dt>相对时间</dt>
                <dd>{{ formatRelativeTime(claim.createdTime) }}</dd>
              </div>
            </dl>
          </div>

          <div class="admin-claim-row__actions">
            <RouterLink
              class="btn btn--small btn--ghost"
              :to="{ name: 'itemDetail', params: { itemId: String(claim.itemId) } }"
            >
              查看物品
            </RouterLink>
            <template v-if="claim.claimStatus === 0">
              <button
                type="button"
                class="btn btn--small btn--primary"
                :disabled="busyClaimId === claim.claimId"
                @click="handleReview(claim, 'approve')"
              >
                通过
              </button>
              <button
                type="button"
                class="btn btn--small btn--danger"
                :disabled="busyClaimId === claim.claimId"
                @click="handleReview(claim, 'reject')"
              >
                驳回
              </button>
            </template>
          </div>
        </article>
      </div>

      <EmptyState
        v-else-if="errorMessage === ''"
        title="没有待处理的申请"
        :message="`当前筛选「${claimStatusMeta[statusFilter].label}」下没有记录。`"
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
        empty-hint="已列出全部申请"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-claims__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.admin-claims__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.admin-claims__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-claims__skeleton {
  height: 132px;
  border-radius: var(--radius-lg);
}

.admin-claim-row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
}

.admin-claim-row__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.admin-claim-row__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.admin-claim-row__id {
  color: var(--ink-tertiary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.admin-claim-row__reason {
  font-size: 15px;
  line-height: 1.55;
}

.admin-claim-row__facts {
  display: grid;
  gap: 4px var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  margin: var(--space-1) 0 0;
}

.admin-claim-row__facts > div {
  display: flex;
  gap: var(--space-2);
  font-size: 13px;
}

.admin-claim-row__facts dt {
  flex: 0 0 64px;
  color: var(--ink-tertiary);
}

.admin-claim-row__facts dd {
  margin: 0;
}

.admin-claim-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
  max-width: 220px;
}

@media (max-width: 820px) {
  .admin-claim-row {
    grid-template-columns: 1fr;
  }

  .admin-claim-row__actions {
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
