<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/empty-state.vue'
import MediaThumb from '@/components/media-thumb.vue'
import StatusPill from '@/components/status-pill.vue'
import { deleteClaim, fetchClaimDetail, updateClaim } from '@/api/claim-api'
import { ApiError } from '@/api/api-error'
import { claimStatusMeta, itemTypeMeta } from '@/constants/domain'
import { useUserStore } from '@/stores/user'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { formatDateTime } from '@/utils/date-format'
import { validateClaimReason } from '@/utils/validators'
import type { ClaimDetail } from '@/types/claim'

/** 申请详情：可以在「待审批」时修改理由或取消申请 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const claim = ref<ClaimDetail | null>(null)
const isLoading = ref(true)
const isMissing = ref(false)
const loadError = ref('')

const isEditing = ref(false)
const draftReason = ref('')
const formError = ref('')
const isSaving = ref(false)

const claimId = computed(() => Number(route.params.claimId))
const statusMeta = computed(() =>
  claim.value === null ? null : claimStatusMeta[claim.value.claimStatus],
)
const canModify = computed(
  () =>
    claim.value !== null &&
    claim.value.claimStatus === 0 &&
    (userStore.currentUserId === claim.value.userId || userStore.isSystemAdmin),
)
const coverImage = computed(() => claim.value?.item?.images[0] ?? '')

async function loadClaim(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  isMissing.value = false
  try {
    claim.value = await fetchClaimDetail(claimId.value)
    draftReason.value = claim.value?.reason ?? ''
  } catch (error) {
    claim.value = null
    isMissing.value = error instanceof ApiError ? error.isNotFound : false
    loadError.value = resolveErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

function startEditing(): void {
  isEditing.value = true
  formError.value = ''
}

function cancelEditing(): void {
  isEditing.value = false
  draftReason.value = claim.value?.reason ?? ''
  formError.value = ''
}

async function handleSave(): Promise<void> {
  if (claim.value === null) return
  const validationError = validateClaimReason(draftReason.value)
  if (validationError !== '') {
    formError.value = validationError
    return
  }

  isSaving.value = true
  formError.value = ''
  try {
    await updateClaim(
      claim.value.claimId,
      { reason: draftReason.value.trim(), applicantContact: claim.value.contact },
      { silent: true },
    )
    showSuccessToast('申请已更新')
    isEditing.value = false
    await loadClaim()
  } catch (error) {
    formError.value = resolveErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}

async function handleCancelClaim(): Promise<void> {
  if (claim.value === null) return
  const isConfirmed = await requestConfirm({
    title: '取消认领申请',
    message: '取消后如需再次认领，需要重新提交申请。确定取消？',
    confirmText: '取消申请',
    danger: true,
  })
  if (!isConfirmed) return

  try {
    await deleteClaim(claim.value.claimId, { silent: true })
    showSuccessToast('申请已取消')
    await router.push({ name: 'myClaims' })
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  }
}

watch(
  claimId,
  () => {
    void loadClaim()
  },
  { immediate: true },
)
</script>

<template>
  <div class="claim-detail page-section">
    <div class="content-container claim-detail__inner">
      <p v-if="isLoading" class="claim-detail__loading">正在加载申请详情…</p>

      <EmptyState
        v-else-if="claim === null && isMissing"
        title="这条申请不存在"
        message="可能已被取消，或者不属于当前账号。"
      >
        <RouterLink class="btn btn--primary" :to="{ name: 'myClaims' }">回到我的认领</RouterLink>
      </EmptyState>

      <EmptyState v-else-if="claim === null" title="这次没能取到数据" :message="loadError">
        <button type="button" class="btn btn--primary" @click="loadClaim()">重新加载</button>
      </EmptyState>

      <template v-else>
        <nav class="claim-detail__breadcrumb" aria-label="面包屑">
          <RouterLink :to="{ name: 'myClaims' }">我的认领</RouterLink>
          <span aria-hidden="true">/</span>
          <span>申请 #{{ claim.claimId }}</span>
        </nav>

        <header class="claim-detail__header">
          <StatusPill :label="statusMeta?.label ?? ''" :tone="statusMeta?.tone" />
          <h1 class="section-title">认领申请 #{{ claim.claimId }}</h1>
          <p class="claim-detail__time">
            提交于 {{ formatDateTime(claim.createdTime) }}
            <template v-if="claim.lastEditTime !== '' && claim.lastEditTime !== claim.createdTime">
              · 最后修改 {{ formatDateTime(claim.lastEditTime) }}
            </template>
          </p>
        </header>

        <div class="claim-detail__grid">
          <section class="claim-detail__card surface-card">
            <h2 class="block-title">申请理由</h2>
            <template v-if="isEditing">
              <label class="field">
                <span class="sr-only">申请理由</span>
                <textarea v-model="draftReason" class="textarea" rows="4"></textarea>
              </label>
              <p v-if="formError !== ''" class="field__error">{{ formError }}</p>
              <div class="claim-detail__form-actions">
                <button type="button" class="btn btn--ghost" @click="cancelEditing">取消</button>
                <button
                  type="button"
                  class="btn btn--primary"
                  :disabled="isSaving"
                  @click="handleSave"
                >
                  {{ isSaving ? '保存中…' : '保存' }}
                </button>
              </div>
            </template>
            <template v-else>
              <p class="claim-detail__reason">{{ claim.reason }}</p>
              <p class="claim-detail__contact">
                <span class="text-tertiary">联系方式</span>
                {{ claim.contact || '未填写' }}
              </p>
              <div v-if="canModify" class="claim-detail__form-actions">
                <button type="button" class="btn btn--small btn--quiet" @click="startEditing">
                  修改理由
                </button>
                <button type="button" class="btn btn--small btn--danger" @click="handleCancelClaim">
                  取消申请
                </button>
              </div>
            </template>
          </section>

          <section class="claim-detail__item surface-card">
            <h2 class="block-title">对应物品</h2>
            <template v-if="claim.item !== null">
              <RouterLink
                class="claim-detail__item-link"
                :to="{ name: 'itemDetail', params: { itemId: String(claim.item.itemId) } }"
              >
                <div class="claim-detail__item-thumb">
                  <MediaThumb :src="coverImage" :alt="claim.item.itemName" ratio="1 / 1" />
                </div>
                <div>
                  <p class="claim-detail__item-name">{{ claim.item.itemName }}</p>
                  <p class="claim-detail__item-meta">
                    {{ itemTypeMeta[claim.item.type].label }} · {{ claim.item.category }}
                    <template v-if="claim.item.location !== ''">
                      · {{ claim.item.location }}</template
                    >
                  </p>
                </div>
              </RouterLink>
            </template>
            <p v-else class="text-secondary">对应物品已不存在或已被删除，这条申请记录仍然保留。</p>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.claim-detail__inner {
  max-width: 900px;
}

.claim-detail__loading {
  padding: var(--space-16) 0;
  color: var(--ink-secondary);
}

.claim-detail__breadcrumb {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  color: var(--ink-tertiary);
  font-size: 13px;
}

.claim-detail__breadcrumb a {
  color: var(--ink-secondary);
}

.claim-detail__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
  margin-bottom: var(--space-8);
}

.claim-detail__time {
  color: var(--ink-tertiary);
  font-size: 13px;
}

.claim-detail__grid {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.claim-detail__card,
.claim-detail__item {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
}

.claim-detail__reason {
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.claim-detail__contact {
  font-size: 14px;
}

.claim-detail__form-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.claim-detail__item-link {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  color: inherit;
}

.claim-detail__item-link:hover {
  text-decoration: none;
}

.claim-detail__item-thumb {
  flex: 0 0 72px;
  width: 72px;
  overflow: hidden;
  border-radius: var(--radius-md);
}

.claim-detail__item-name {
  font-weight: 600;
}

.claim-detail__item-meta {
  margin-top: 2px;
  color: var(--ink-tertiary);
  font-size: 13px;
}
</style>
