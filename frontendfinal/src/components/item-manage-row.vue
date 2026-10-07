<script setup lang="ts">
import { computed } from 'vue'

import MediaThumb from '@/components/media-thumb.vue'
import StatusPill from '@/components/status-pill.vue'
import { itemStatusMeta, itemTypeMeta } from '@/constants/domain'
import { formatDateTime, formatRelativeTime } from '@/utils/date-format'
import type { ItemRecord } from '@/types/item'

/** 「我的发布」行：左图右信息，右侧动作区 */
const props = defineProps<{ item: ItemRecord }>()

const emit = defineEmits<{
  remove: []
  closeClaim: []
  edit: []
}>()

const typeMeta = computed(() => itemTypeMeta[props.item.type])
const statusMeta = computed(() => itemStatusMeta[props.item.itemStatus])
const coverImage = computed(() => props.item.images[0] ?? '')
const canEdit = computed(() => props.item.itemStatus !== 3)
const canCloseClaim = computed(() => props.item.type === 'found' && props.item.itemStatus === 1)
</script>

<template>
  <article class="manage-row">
    <RouterLink
      class="manage-row__media"
      :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }"
    >
      <MediaThumb :src="coverImage" :alt="item.itemName" ratio="1 / 1" />
    </RouterLink>

    <div class="manage-row__body">
      <div class="manage-row__badges">
        <StatusPill :label="typeMeta.label" :tone="typeMeta.tone" />
        <StatusPill :label="statusMeta.label" :tone="statusMeta.tone" />
      </div>

      <h3 class="manage-row__title">
        <RouterLink :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }">
          {{ item.itemName }}
        </RouterLink>
      </h3>

      <p class="manage-row__meta">
        <span>{{ item.category }}</span>
        <span v-if="item.location !== ''">· {{ item.location }}</span>
        <span>· 发布于 {{ formatRelativeTime(item.createdTime) }}</span>
      </p>

      <p v-if="item.itemStatus === 2 && item.rejectReason !== ''" class="manage-row__reject">
        驳回理由：{{ item.rejectReason }}
      </p>

      <p
        v-if="item.lastEditTime !== '' && item.lastEditTime !== item.createdTime"
        class="manage-row__edited"
      >
        最后修改：{{ formatDateTime(item.lastEditTime) }}
      </p>
    </div>

    <div class="manage-row__actions">
      <RouterLink
        v-if="canEdit"
        class="btn btn--small btn--quiet"
        :to="{ name: 'itemEdit', params: { itemId: String(item.itemId) } }"
        @click="emit('edit')"
      >
        修改
      </RouterLink>
      <button
        v-if="canCloseClaim"
        type="button"
        class="btn btn--small btn--quiet"
        @click="emit('closeClaim')"
      >
        关闭认领
      </button>
      <button type="button" class="btn btn--small btn--danger" @click="emit('remove')">删除</button>
    </div>
  </article>
</template>

<style scoped>
.manage-row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: 88px minmax(0, 1fr) auto;
  align-items: start;
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
  transition: box-shadow var(--duration-base) var(--ease-out);
}

.manage-row:hover {
  box-shadow: var(--shadow-card);
}

.manage-row__media {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}

.manage-row__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.manage-row__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.manage-row__title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.manage-row__title a {
  color: var(--ink-primary);
}

.manage-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--ink-tertiary);
  font-size: 13px;
}

.manage-row__reject {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13px;
}

.manage-row__edited {
  color: var(--ink-tertiary);
  font-size: 12px;
}

.manage-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .manage-row {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .manage-row__actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
