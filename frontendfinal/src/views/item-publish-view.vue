<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ItemForm from '@/components/item-form.vue'
import { createItem } from '@/api/item-api'
import { itemTypeMeta } from '@/constants/domain'
import { useUserStore } from '@/stores/user'
import { showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { fromDateTimeLocalValue } from '@/utils/date-format'
import type { ItemFormDraft, ItemType } from '@/types/item'

/** 发布信息：类型可切换，提交后进入「待审核」 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const typeMeta = itemTypeMeta
const publishType = ref<ItemType>(route.query.type === 'found' ? 'found' : 'lost')
const isSubmitting = ref(false)
const serverError = ref('')

function createEmptyDraft(): ItemFormDraft {
  return {
    itemName: '',
    category: '',
    location: '',
    happenTime: '',
    description: '',
    images: [],
    getLocation: '',
    // 联系方式用账号里的现成信息预填，省一次输入
    getContact: userStore.userProfile?.contact ?? '',
  }
}

const draft = ref<ItemFormDraft>(createEmptyDraft())

const pageTitle = computed(() => typeMeta[publishType.value].actionLabel)

function handleTypeUpdate(value: ItemType): void {
  publishType.value = value
  void router.replace({ name: 'itemPublish', query: { type: value } })
}

async function handleSubmit(): Promise<void> {
  isSubmitting.value = true
  serverError.value = ''
  try {
    await createItem(
      publishType.value,
      {
        type: publishType.value,
        ...draft.value,
        itemName: draft.value.itemName.trim(),
        category: draft.value.category,
        location: draft.value.location.trim(),
        description: draft.value.description.trim(),
        getLocation: draft.value.getLocation.trim(),
        getContact: draft.value.getContact.trim(),
        happenTime: fromDateTimeLocalValue(draft.value.happenTime),
      },
      { silent: true },
    )
    showSuccessToast('发布成功，已提交审核')
    await router.push({ name: 'myItems' })
  } catch (error) {
    serverError.value = resolveErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  // 档案缺失时补拉一次，让联系方式预填可用
  if (userStore.isLoggedIn && userStore.userProfile === null) {
    try {
      const refreshedProfile = await userStore.refreshProfile({ silent: true })
      draft.value.getContact = refreshedProfile?.contact ?? ''
    } catch {
      /* 取不到档案不影响发布，联系方式留空由用户填 */
    }
  }
})
</script>

<template>
  <div class="publish-view page-section">
    <div class="content-container publish-view__inner">
      <header class="publish-view__header">
        <p class="eyebrow">发布</p>
        <h1 class="section-title">{{ pageTitle }}</h1>
        <p class="lead">填写清楚特征与地点，信息会先进入审核，通过后出现在公开信息流里。</p>
      </header>

      <div class="publish-view__card surface-card">
        <ItemForm
          v-model="draft"
          :type="publishType"
          :is-submitting="isSubmitting"
          :server-error="serverError"
          submit-label="提交审核"
          @update:type="handleTypeUpdate"
          @submit="handleSubmit"
        >
          <template #actions>
            <RouterLink
              class="btn btn--ghost"
              :to="{ name: 'itemFeed', params: { type: publishType } }"
            >
              取消
            </RouterLink>
          </template>
        </ItemForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.publish-view__inner {
  max-width: 860px;
}

.publish-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.publish-view__card {
  padding: var(--space-8);
}

@media (max-width: 640px) {
  .publish-view__card {
    padding: var(--space-5);
  }
}
</style>
