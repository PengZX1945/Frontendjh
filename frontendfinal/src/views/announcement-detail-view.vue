<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import EmptyState from '@/components/empty-state.vue'
import { fetchAnnouncementDetail } from '@/api/announcement-api'
import { ApiError } from '@/api/api-error'
import { resolveErrorMessage } from '@/utils/error-message'
import { formatDateTime } from '@/utils/date-format'
import type { AnnouncementRecord } from '@/types/announcement'

/** 公告详情：正文按发布时的换行原样呈现 */
const route = useRoute()

const announcement = ref<AnnouncementRecord | null>(null)
const isLoading = ref(true)
const isMissing = ref(false)
const errorMessage = ref('')

const announcementId = computed(() => Number(route.params.announcementId))

async function loadAnnouncement(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''
  isMissing.value = false
  try {
    announcement.value = await fetchAnnouncementDetail(announcementId.value)
  } catch (error) {
    announcement.value = null
    isMissing.value = error instanceof ApiError ? error.isNotFound : false
    errorMessage.value = resolveErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

watch(
  announcementId,
  () => {
    void loadAnnouncement()
  },
  { immediate: true },
)
</script>

<template>
  <div class="announcement-detail page-section">
    <div class="content-container announcement-detail__inner">
      <p v-if="isLoading" class="announcement-detail__loading">正在加载公告…</p>

      <EmptyState
        v-else-if="announcement === null && isMissing"
        title="这条公告不存在"
        message="可能已经下线或被删除。"
      >
        <RouterLink class="btn btn--primary" :to="{ name: 'announcementList' }"
          >回到公告列表</RouterLink
        >
      </EmptyState>

      <EmptyState
        v-else-if="announcement === null"
        title="这次没能取到数据"
        :message="errorMessage"
      >
        <button type="button" class="btn btn--primary" @click="loadAnnouncement()">重新加载</button>
      </EmptyState>

      <template v-else>
        <RouterLink class="announcement-detail__back" :to="{ name: 'announcementList' }">
          ← 全部公告
        </RouterLink>

        <article class="announcement-detail__article">
          <p class="eyebrow">公告</p>
          <h1 class="announcement-detail__title display-title">{{ announcement.title }}</h1>
          <p class="announcement-detail__date">
            发布于 {{ formatDateTime(announcement.createdTime) }}
          </p>
          <div class="announcement-detail__content">{{ announcement.content }}</div>
        </article>
      </template>
    </div>
  </div>
</template>

<style scoped>
.announcement-detail__inner {
  max-width: 760px;
}

.announcement-detail__loading {
  padding: var(--space-16) 0;
  color: var(--ink-secondary);
}

.announcement-detail__back {
  display: inline-block;
  margin-bottom: var(--space-6);
  color: var(--ink-secondary);
  font-size: 14px;
}

.announcement-detail__article {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.announcement-detail__title {
  font-size: clamp(28px, 4vw, 42px);
}

.announcement-detail__date {
  color: var(--ink-tertiary);
  font-size: 13px;
}

.announcement-detail__content {
  margin-top: var(--space-6);
  color: var(--ink-primary);
  font-size: 17px;
  line-height: 1.75;
  letter-spacing: -0.005em;
  white-space: pre-wrap;
}
</style>
