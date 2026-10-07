<script setup lang="ts">
import { computed } from 'vue'

import MediaThumb from '@/components/media-thumb.vue'
import { itemTypeMeta } from '@/constants/domain'
import { formatRelativeTime } from '@/utils/date-format'
import type { ItemRecord } from '@/types/item'

/** 信息流卡片：图片在上、信息在下，整卡可点，悬停轻微抬升 */
const props = defineProps<{ item: ItemRecord }>()

const typeMeta = computed(() => itemTypeMeta[props.item.type])
const coverImage = computed(() => props.item.images[0] ?? '')
const descriptionText = computed(() => props.item.description || '发布者未填写更多描述')
const timeText = computed(() =>
  formatRelativeTime(props.item.happenTime !== '' ? props.item.happenTime : props.item.createdTime),
)
</script>

<template>
  <RouterLink
    class="item-card"
    :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }"
  >
    <div class="item-card__media">
      <MediaThumb :src="coverImage" :alt="item.itemName" ratio="4 / 3" />
      <span class="item-card__type" :class="`item-card__type--${item.type}`">
        {{ typeMeta.label }}
      </span>
    </div>

    <div class="item-card__body">
      <h3 class="item-card__title">{{ item.itemName }}</h3>
      <p class="item-card__description">{{ descriptionText }}</p>

      <div class="item-card__meta">
        <span class="item-card__category">{{ item.category }}</span>
        <span v-if="item.location !== ''" class="item-card__location">{{ item.location }}</span>
        <span class="item-card__time">{{ timeText }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.item-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
  color: inherit;
  transition:
    transform var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out);
}

.item-card:hover {
  transform: translateY(-4px);
  border-color: transparent;
  box-shadow: var(--shadow-raised);
  text-decoration: none;
}

.item-card:hover .item-card__media :deep(.media-thumb__image) {
  transform: scale(1.04);
}

.item-card__media {
  position: relative;
  background: var(--surface-sunken);
}

.item-card__type {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  padding: 4px 11px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  color: var(--ink-primary);
}

.item-card__type--lost {
  background: var(--accent);
  color: #fff;
}

.item-card__type--found {
  background: rgba(255, 255, 255, 0.92);
  color: var(--positive);
}

.item-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
}

.item-card__title {
  overflow: hidden;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-card__description {
  display: -webkit-box;
  overflow: hidden;
  min-height: 40px;
  color: var(--ink-secondary);
  font-size: 14px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.item-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-1);
  color: var(--ink-tertiary);
  font-size: 13px;
}

.item-card__category {
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  color: var(--ink-secondary);
  font-weight: 500;
}

.item-card__location {
  overflow: hidden;
  max-width: 130px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-card__time::before {
  content: '·';
  margin-right: var(--space-2);
}
</style>
