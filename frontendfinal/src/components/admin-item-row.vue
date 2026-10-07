<script setup lang="ts">
import { computed } from 'vue'

import MediaThumb from '@/components/media-thumb.vue'
import StatusPill from '@/components/status-pill.vue'
import { itemStatusMeta, itemTypeMeta } from '@/constants/domain'
import { formatDateTime } from '@/utils/date-format'
import type { ItemRecord } from '@/types/item'

/**
 * 管理端物品行：信息一侧统一，动作按钮由使用方通过 `actions` 插槽注入
 * （审核台给的是「通过 / 驳回」，总览给的是「关闭 / 删除」）。
 */
const props = defineProps<{
  item: ItemRecord
  /** 是否展示驳回理由 */
  showRejectReason?: boolean
}>()

const typeMeta = computed(() => itemTypeMeta[props.item.type])
const statusMeta = computed(() => itemStatusMeta[props.item.itemStatus])
const coverImage = computed(() => props.item.images[0] ?? '')
</script>

<template>
  <article class="admin-row">
    <div class="admin-row__media">
      <MediaThumb :src="coverImage" :alt="item.itemName" ratio="1 / 1" />
    </div>

    <div class="admin-row__body">
      <div class="admin-row__badges">
        <StatusPill :label="typeMeta.label" :tone="typeMeta.tone" />
        <StatusPill :label="statusMeta.label" :tone="statusMeta.tone" />
        <span class="admin-row__id">#{{ item.itemId }}</span>
      </div>

      <h3 class="admin-row__title">
        <RouterLink :to="{ name: 'itemDetail', params: { itemId: String(item.itemId) } }">
          {{ item.itemName }}
        </RouterLink>
      </h3>

      <p v-if="item.description !== ''" class="admin-row__description">{{ item.description }}</p>

      <dl class="admin-row__facts">
        <div>
          <dt>分类</dt>
          <dd>{{ item.category }}</dd>
        </div>
        <div>
          <dt>地点</dt>
          <dd>{{ item.location || '未填写' }}</dd>
        </div>
        <div>
          <dt>时间</dt>
          <dd>{{ item.happenTime || '未填写' }}</dd>
        </div>
        <div>
          <dt>联系</dt>
          <dd>{{ item.getContact || '未填写' }}</dd>
        </div>
        <div>
          <dt>发布者</dt>
          <dd>#{{ item.posterId }}</dd>
        </div>
        <div>
          <dt>提交于</dt>
          <dd>{{ formatDateTime(item.createdTime) }}</dd>
        </div>
      </dl>

      <p v-if="showRejectReason === true && item.rejectReason !== ''" class="admin-row__reject">
        驳回理由：{{ item.rejectReason }}
      </p>
    </div>

    <div class="admin-row__actions">
      <slot name="actions" />
    </div>

    <div v-if="$slots.default" class="admin-row__extra">
      <slot />
    </div>
  </article>
</template>

<style scoped>
.admin-row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: 96px minmax(0, 1fr) auto;
  align-items: start;
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
}

.admin-row__media {
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}

.admin-row__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.admin-row__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.admin-row__id {
  color: var(--ink-tertiary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.admin-row__title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.admin-row__title a {
  color: var(--ink-primary);
}

.admin-row__description {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-secondary);
  font-size: 14px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.admin-row__facts {
  display: grid;
  gap: 6px var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin: var(--space-1) 0 0;
}

.admin-row__facts > div {
  display: flex;
  gap: var(--space-2);
  font-size: 13px;
}

.admin-row__facts dt {
  flex: 0 0 56px;
  color: var(--ink-tertiary);
}

.admin-row__facts dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-row__reject {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13px;
}

.admin-row__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: stretch;
}

/* 展开区（如审核台的驳回理由表单）横跨整行 */
.admin-row__extra {
  grid-column: 1 / -1;
}

@media (max-width: 820px) {
  .admin-row {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .admin-row__actions {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
