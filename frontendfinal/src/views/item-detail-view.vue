<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/empty-state.vue'
import MediaThumb from '@/components/media-thumb.vue'
import StatusPill from '@/components/status-pill.vue'
import { closeItemClaim, deleteItem, fetchItemDetail } from '@/api/item-api'
import { submitClaim } from '@/api/claim-api'
import { ApiError } from '@/api/api-error'
import { itemStatusMeta, itemTypeMeta } from '@/constants/domain'
import { useUserStore } from '@/stores/user'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { formatDateTime, formatRelativeTime } from '@/utils/date-format'
import { validateClaimReason } from '@/utils/validators'
import type { ItemRecord } from '@/types/item'

/** 物品详情：左图右文，底部按角色给出可用动作（认领 / 编辑 / 关闭 / 删除） */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const item = ref<ItemRecord | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const isMissing = ref(false)
const activeImageIndex = ref(0)

const isClaimPanelOpen = ref(false)
const claimReason = ref('')
const claimError = ref('')
const isSubmittingClaim = ref(false)
const isClosing = ref(false)

const itemId = computed(() => Number(route.params.itemId))

const typeMeta = computed(() => (item.value === null ? null : itemTypeMeta[item.value.type]))
const statusMeta = computed(() =>
  item.value === null ? null : itemStatusMeta[item.value.itemStatus],
)
const activeImage = computed(() => item.value?.images[activeImageIndex.value] ?? '')

const isOwner = computed(
  () =>
    item.value !== null && userStore.isLoggedIn && item.value.posterId === userStore.currentUserId,
)
/** 状态与驳回理由只对本人与管理员有意义 */
const canSeeModerationInfo = computed(() => isOwner.value || userStore.isBackOffice)
/** 只有「已发布的失物招领」能发起认领（接口：type=found && status=1，且不能认领自己的帖子） */
const canSubmitClaim = computed(
  () =>
    item.value !== null &&
    item.value.type === 'found' &&
    item.value.itemStatus === 1 &&
    userStore.isLoggedIn &&
    !isOwner.value,
)
const canEdit = computed(() => isOwner.value && item.value !== null && item.value.itemStatus !== 3)
const canClose = computed(
  () =>
    item.value !== null &&
    item.value.type === 'found' &&
    item.value.itemStatus === 1 &&
    (isOwner.value || userStore.isBackOffice),
)
const canDelete = computed(() => isOwner.value || userStore.isBackOffice)

async function loadItem(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  isMissing.value = false
  try {
    item.value = await fetchItemDetail(itemId.value)
    activeImageIndex.value = 0
  } catch (error) {
    item.value = null
    isMissing.value = error instanceof ApiError ? error.isNotFound : false
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

function toggleClaimPanel(): void {
  isClaimPanelOpen.value = !isClaimPanelOpen.value
  claimError.value = ''
}

async function handleSubmitClaim(): Promise<void> {
  const validationError = validateClaimReason(claimReason.value)
  if (validationError !== '') {
    claimError.value = validationError
    return
  }

  isSubmittingClaim.value = true
  claimError.value = ''
  try {
    await submitClaim(itemId.value, { reason: claimReason.value.trim() }, { silent: true })
    isClaimPanelOpen.value = false
    claimReason.value = ''
    showSuccessToast('认领申请已提交，等待管理员审批')
  } catch (error) {
    claimError.value = resolveErrorMessage(error)
  } finally {
    isSubmittingClaim.value = false
  }
}

async function handleCloseClaim(): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '关闭认领通道',
    message: '关闭后其他人将无法再申请认领，已提交的申请也不再受理。确定关闭？',
    confirmText: '关闭认领',
    danger: true,
  })
  if (!isConfirmed) return

  isClosing.value = true
  try {
    await closeItemClaim(itemId.value, { silent: true })
    showSuccessToast('认领通道已关闭')
    await loadItem()
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  } finally {
    isClosing.value = false
  }
}

async function handleDelete(): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '删除这条信息',
    message: '删除后无法恢复，相关认领申请也会失去关联。确定删除？',
    confirmText: '删除',
    danger: true,
  })
  if (!isConfirmed) return

  try {
    await deleteItem(itemId.value, { silent: true })
    showSuccessToast('已删除')
    await router.push({ name: 'myItems' })
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  }
}

watch(
  itemId,
  () => {
    void loadItem()
  },
  { immediate: true },
)
</script>

<template>
  <div class="detail-view page-section">
    <div class="content-container">
      <p v-if="isLoading" class="detail-view__loading">正在加载物品详情…</p>

      <EmptyState
        v-else-if="item === null && isMissing"
        title="这条信息不存在或已被删除"
        message="可能发布者已经撤下，或者链接已经失效。"
      >
        <RouterLink class="btn btn--primary" :to="{ name: 'itemFeed', params: { type: 'lost' } }">
          回到信息流
        </RouterLink>
      </EmptyState>

      <EmptyState v-else-if="item === null" title="这次没能取到数据" :message="errorMessage">
        <button type="button" class="btn btn--primary" @click="loadItem()">重新加载</button>
      </EmptyState>

      <template v-else>
        <nav class="detail-view__breadcrumb" aria-label="面包屑">
          <RouterLink :to="{ name: 'itemFeed', params: { type: item.type } }">
            {{ typeMeta?.label }}
          </RouterLink>
          <span aria-hidden="true">/</span>
          <span>{{ item.itemName }}</span>
        </nav>

        <article class="detail-layout">
          <div class="detail-gallery">
            <div class="detail-gallery__stage">
              <MediaThumb :src="activeImage" :alt="item.itemName" ratio="4 / 3" />
            </div>
            <ul v-if="item.images.length > 1" class="detail-gallery__thumbs">
              <li v-for="(imageUrl, index) in item.images" :key="imageUrl">
                <button
                  type="button"
                  class="detail-gallery__thumb"
                  :class="{ 'detail-gallery__thumb--active': index === activeImageIndex }"
                  :aria-label="`查看第 ${index + 1} 张图片`"
                  @click="activeImageIndex = index"
                >
                  <img :src="imageUrl" :alt="`${item.itemName} 图片 ${index + 1}`" loading="lazy" />
                </button>
              </li>
            </ul>
          </div>

          <div class="detail-info">
            <div class="detail-info__badges">
              <StatusPill :label="typeMeta?.label ?? ''" :tone="typeMeta?.tone" />
              <StatusPill
                v-if="canSeeModerationInfo"
                :label="statusMeta?.label ?? ''"
                :tone="statusMeta?.tone"
              />
              <StatusPill v-if="isOwner" label="我发布的" tone="neutral" />
            </div>

            <h1 class="detail-info__title">{{ item.itemName }}</h1>

            <p v-if="canSeeModerationInfo && item.rejectReason !== ''" class="detail-info__reject">
              驳回理由：{{ item.rejectReason }}
            </p>

            <p class="detail-info__description">
              {{ item.description || '发布者未填写更多描述。' }}
            </p>

            <dl class="detail-info__facts">
              <div>
                <dt>分类</dt>
                <dd>{{ item.category }}</dd>
              </div>
              <div>
                <dt>{{ item.type === 'lost' ? '遗失地点' : '发现地点' }}</dt>
                <dd>{{ item.location || '未填写' }}</dd>
              </div>
              <div>
                <dt>{{ item.type === 'lost' ? '遗失时间' : '发现时间' }}</dt>
                <dd>{{ item.happenTime !== '' ? formatDateTime(item.happenTime) : '未填写' }}</dd>
              </div>
              <div>
                <dt>发布时间</dt>
                <dd>
                  {{ formatDateTime(item.createdTime) }}
                  <span class="text-tertiary">（{{ formatRelativeTime(item.createdTime) }}）</span>
                </dd>
              </div>
            </dl>

            <section class="detail-info__contact surface-card">
              <h2 class="block-title">领取方式</h2>
              <dl class="detail-info__contact-list">
                <div>
                  <dt>领取地点</dt>
                  <dd>{{ item.getLocation || '未填写' }}</dd>
                </div>
                <div>
                  <dt>领取联系方式</dt>
                  <dd>{{ item.getContact || '未填写' }}</dd>
                </div>
                <div>
                  <dt>发布者联系方式</dt>
                  <dd>{{ item.posterContact || '未填写' }}</dd>
                </div>
              </dl>
            </section>

            <div class="detail-info__actions">
              <template v-if="canSubmitClaim">
                <button type="button" class="btn btn--primary btn--large" @click="toggleClaimPanel">
                  {{ isClaimPanelOpen ? '收起申请' : '这是我的，申请认领' }}
                </button>
              </template>

              <template
                v-else-if="item.type === 'found' && item.itemStatus === 1 && !userStore.isLoggedIn"
              >
                <RouterLink
                  class="btn btn--primary btn--large"
                  :to="{ name: 'userLogin', query: { redirect: route.fullPath } }"
                >
                  登录后申请认领
                </RouterLink>
              </template>

              <template v-if="isOwner">
                <RouterLink
                  v-if="canEdit"
                  class="btn btn--quiet"
                  :to="{ name: 'itemEdit', params: { itemId: String(item.itemId) } }"
                >
                  修改信息
                </RouterLink>
                <button
                  v-if="canClose"
                  type="button"
                  class="btn btn--quiet"
                  :disabled="isClosing"
                  @click="handleCloseClaim"
                >
                  {{ isClosing ? '处理中…' : '关闭认领通道' }}
                </button>
                <button
                  v-if="canDelete"
                  type="button"
                  class="btn btn--danger"
                  @click="handleDelete"
                >
                  删除
                </button>
              </template>

              <button
                v-else-if="userStore.isBackOffice && canDelete"
                type="button"
                class="btn btn--danger"
                @click="handleDelete"
              >
                删除（管理员）
              </button>
            </div>

            <form v-if="isClaimPanelOpen" class="claim-panel" @submit.prevent="handleSubmitClaim">
              <label class="field">
                <span class="field__label field__label-required">认领理由</span>
                <textarea
                  v-model="claimReason"
                  class="textarea"
                  :class="{ 'textarea--invalid': claimError !== '' }"
                  rows="4"
                  placeholder="描述物品的可辨识特征（颜色、品牌、内含物、特征外观等），管理员会据此核对。"
                ></textarea>
              </label>
              <p v-if="claimError !== ''" class="field__error">{{ claimError }}</p>
              <div class="claim-panel__actions">
                <button type="button" class="btn btn--ghost" @click="toggleClaimPanel">取消</button>
                <button type="submit" class="btn btn--primary" :disabled="isSubmittingClaim">
                  <span v-if="isSubmittingClaim" class="btn__spinner" aria-hidden="true"></span>
                  {{ isSubmittingClaim ? '提交中…' : '提交申请' }}
                </button>
              </div>
            </form>
          </div>
        </article>
      </template>
    </div>
  </div>
</template>

<style scoped>
.detail-view__loading {
  padding: var(--space-16) 0;
  color: var(--ink-secondary);
}

.detail-view__breadcrumb {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  color: var(--ink-tertiary);
  font-size: 13px;
}

.detail-view__breadcrumb a {
  color: var(--ink-secondary);
}

.detail-layout {
  display: grid;
  gap: var(--space-12);
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  align-items: start;
}

.detail-gallery {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-gallery__stage {
  overflow: hidden;
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-xl);
}

.detail-gallery__thumbs {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.detail-gallery__thumb {
  width: 72px;
  height: 72px;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  cursor: pointer;
}

.detail-gallery__thumb--active {
  border-color: var(--accent);
}

.detail-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.detail-info__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.detail-info__title {
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -0.02em;
}

.detail-info__reject {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 14px;
}

.detail-info__description {
  color: var(--ink-secondary);
  font-size: 16px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.detail-info__facts,
.detail-info__contact-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
}

.detail-info__facts > div,
.detail-info__contact-list > div {
  display: flex;
  gap: var(--space-4);
}

.detail-info__facts dt,
.detail-info__contact-list dt {
  flex: 0 0 108px;
  color: var(--ink-tertiary);
  font-size: 14px;
}

.detail-info__facts dd,
.detail-info__contact-list dd {
  margin: 0;
  font-size: 15px;
}

.detail-info__contact {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.detail-info__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.claim-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
}

.claim-panel__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }
}
</style>
