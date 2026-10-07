<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/empty-state.vue'
import ItemForm from '@/components/item-form.vue'
import { fetchItemDetail, updateItem } from '@/api/item-api'
import { ApiError } from '@/api/api-error'
import { itemStatusMeta, itemTypeMeta } from '@/constants/domain'
import { useUserStore } from '@/stores/user'
import { showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/utils/date-format'
import type { ItemFormDraft, ItemRecord } from '@/types/item'

/**
 * 修改信息。
 * 接口约定：仅「待审核 / 已驳回 / 已发布」可改，且修改后状态会重置为「待审核」——
 * 这一点在页面顶部明确告知，避免用户以为改完仍然挂在信息流上。
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const item = ref<ItemRecord | null>(null)
const draft = ref<ItemFormDraft>(createEmptyDraft())
const isLoading = ref(true)
const isSubmitting = ref(false)
const loadError = ref('')
const serverError = ref('')

const itemId = computed(() => Number(route.params.itemId))

function createEmptyDraft(): ItemFormDraft {
  return {
    itemName: '',
    category: '',
    location: '',
    happenTime: '',
    description: '',
    images: [],
    getLocation: '',
    getContact: '',
  }
}

function fillDraftFromItem(record: ItemRecord): void {
  draft.value = {
    itemName: record.itemName,
    category: record.category,
    location: record.location,
    happenTime: toDateTimeLocalValue(record.happenTime),
    description: record.description,
    images: [...record.images],
    getLocation: record.getLocation,
    getContact: record.getContact,
  }
}

/** 是否允许修改：本人（或管理员）且状态不是「已关闭」 */
const canEdit = computed(() => {
  if (item.value === null) return false
  const isOwnerOrAdmin =
    (userStore.isLoggedIn && item.value.posterId === userStore.currentUserId) ||
    userStore.isBackOffice
  return isOwnerOrAdmin && item.value.itemStatus !== 3
})

async function loadItem(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    const record = await fetchItemDetail(itemId.value)
    item.value = record
    fillDraftFromItem(record)
  } catch (error) {
    item.value = null
    loadError.value = error instanceof ApiError ? resolveErrorMessage(error) : '加载失败'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit(): Promise<void> {
  if (item.value === null) return
  isSubmitting.value = true
  serverError.value = ''
  try {
    await updateItem(
      itemId.value,
      {
        type: item.value.type,
        ...draft.value,
        itemName: draft.value.itemName.trim(),
        location: draft.value.location.trim(),
        description: draft.value.description.trim(),
        getLocation: draft.value.getLocation.trim(),
        getContact: draft.value.getContact.trim(),
        happenTime: fromDateTimeLocalValue(draft.value.happenTime),
      },
      { silent: true },
    )
    showSuccessToast('已保存，状态重置为待审核')
    await router.push({ name: 'myItems' })
  } catch (error) {
    serverError.value = resolveErrorMessage(error)
  } finally {
    isSubmitting.value = false
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
  <div class="edit-view page-section">
    <div class="content-container edit-view__inner">
      <p v-if="isLoading" class="edit-view__loading">正在加载…</p>

      <EmptyState v-else-if="item === null" title="无法打开这条信息" :message="loadError">
        <RouterLink class="btn btn--primary" :to="{ name: 'myItems' }">回到我的发布</RouterLink>
      </EmptyState>

      <EmptyState
        v-else-if="!canEdit"
        title="这条信息当前不可修改"
        :message="
          item.itemStatus === 3
            ? '「已关闭」的信息不能修改。如需重新发布，请新建一条。'
            : '只有发布者本人可以修改，且不能修改他人的信息。'
        "
      >
        <RouterLink
          class="btn btn--primary"
          :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }"
        >
          查看详情
        </RouterLink>
      </EmptyState>

      <template v-else>
        <header class="edit-view__header">
          <p class="eyebrow">{{ itemTypeMeta[item.type].label }}</p>
          <h1 class="section-title">修改信息</h1>
          <p class="lead">
            当前状态「{{ itemStatusMeta[item.itemStatus].label }}」。保存后状态会重置为「待审核」，
            审核通过前不会出现在公开信息流中。
          </p>
        </header>

        <div class="edit-view__card surface-card">
          <ItemForm
            v-model="draft"
            :type="item.type"
            :type-locked="true"
            :is-submitting="isSubmitting"
            :server-error="serverError"
            submit-label="保存修改"
            @submit="handleSubmit"
          >
            <template #actions>
              <RouterLink
                class="btn btn--ghost"
                :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }"
              >
                取消
              </RouterLink>
            </template>
          </ItemForm>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.edit-view__inner {
  max-width: 860px;
}

.edit-view__loading {
  padding: var(--space-16) 0;
  color: var(--ink-secondary);
}

.edit-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.edit-view__card {
  padding: var(--space-8);
}

@media (max-width: 640px) {
  .edit-view__card {
    padding: var(--space-5);
  }
}
</style>
