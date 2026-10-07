<script setup lang="ts">
/** 空态：列表无数据、详情出错、权限不足等都复用它 */
defineProps<{
  title: string
  message?: string
}>()
</script>

<template>
  <div class="empty-state">
    <svg
      class="empty-state__glyph"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <rect x="9" y="14" width="30" height="24" rx="5" />
      <path d="M18 14v-2.5A3.5 3.5 0 0 1 21.5 8h5A3.5 3.5 0 0 1 30 11.5V14" />
      <path d="M9 24h30" stroke-dasharray="3 4" />
    </svg>
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="message" class="empty-state__message">{{ message }}</p>
    <div class="empty-state__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-16) var(--space-6);
  text-align: center;
}

.empty-state__glyph {
  width: 48px;
  height: 48px;
  color: var(--ink-tertiary);
}

.empty-state__title {
  margin-top: var(--space-5);
  font-size: 17px;
  font-weight: 600;
}

.empty-state__message {
  margin-top: var(--space-2);
  max-width: 420px;
  color: var(--ink-secondary);
  font-size: 15px;
  line-height: 1.5;
}

.empty-state__actions:not(:empty) {
  margin-top: var(--space-6);
}
</style>
