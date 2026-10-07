<script setup lang="ts">
import { computed, onMounted } from 'vue'

import EmptyState from '@/components/empty-state.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import { fetchAnnouncementList } from '@/api/announcement-api'
import { usePagedRecords } from '@/composables/use-paged-records'
import { formatDate, formatRelativeTime } from '@/utils/date-format'
import type { AnnouncementRecord } from '@/types/announcement'

/** 公告列表：系统管理员的公告在此对全校公开 */
const announcementPageSize = 8

const { records, hasMore, isInitialLoading, isLoadingMore, errorMessage, loadNextPage, refresh } =
  usePagedRecords<AnnouncementRecord>((page) =>
    fetchAnnouncementList({ page, pageSize: announcementPageSize }),
  )

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

onMounted(() => {
  void refresh()
})
</script>

<template>
  <div class="announcement-list page-section">
    <div class="content-container">
      <header class="announcement-list__header">
        <p class="eyebrow">公告</p>
        <h1 class="section-title">系统公告</h1>
        <p class="lead">失物招领处的通知、认领时间安排与规则调整都会发布在这里。</p>
      </header>

      <div v-if="isInitialLoading" class="announcement-list__items">
        <div v-for="index in 3" :key="index" class="announcement-card">
          <div class="skeleton announcement-card__skeleton-title"></div>
          <div class="skeleton announcement-card__skeleton-line"></div>
          <div
            class="skeleton announcement-card__skeleton-line announcement-card__skeleton-line--short"
          ></div>
        </div>
      </div>

      <div v-else-if="records.length > 0" class="announcement-list__items">
        <RouterLink
          v-for="announcement in records"
          :key="announcement.announcementId"
          class="announcement-card"
          :to="{
            name: 'announcementDetail',
            params: { announcementId: String(announcement.announcementId) },
          }"
        >
          <p class="announcement-card__date">
            {{ formatDate(announcement.createdTime) }}
            <span class="announcement-card__relative"
              >· {{ formatRelativeTime(announcement.createdTime) }}</span
            >
          </p>
          <h2 class="announcement-card__title">{{ announcement.title }}</h2>
          <p class="announcement-card__content">{{ announcement.content }}</p>
          <span class="announcement-card__more">查看全文 →</span>
        </RouterLink>
      </div>

      <EmptyState
        v-else-if="errorMessage === ''"
        title="暂时没有公告"
        message="有新通知时，这里会第一时间更新。"
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
        empty-hint="已列出全部公告"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

<style scoped>
.announcement-list__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.announcement-list__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.announcement-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
  color: inherit;
  transition:
    box-shadow var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out);
}

.announcement-card:hover {
  border-color: transparent;
  box-shadow: var(--shadow-card);
  text-decoration: none;
}

.announcement-card__date {
  color: var(--ink-tertiary);
  font-size: 13px;
}

.announcement-card__relative {
  margin-left: 4px;
}

.announcement-card__title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.announcement-card__content {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-secondary);
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.announcement-card__more {
  margin-top: var(--space-1);
  color: var(--accent-ink);
  font-size: 14px;
  font-weight: 500;
}

.announcement-card__skeleton-title {
  height: 22px;
  width: 42%;
}

.announcement-card__skeleton-line {
  height: 14px;
  width: 100%;
}

.announcement-card__skeleton-line--short {
  width: 64%;
}
</style>
