<script setup lang="ts">
/** 信息流首屏骨架：与 item-card 同尺寸，避免加载完成时的布局跳动 */
defineProps<{ count?: number }>()
</script>

<template>
  <div v-for="index in count ?? 6" :key="index" class="skeleton-card">
    <div class="skeleton skeleton-card__media"></div>
    <div class="skeleton-card__body">
      <div class="skeleton skeleton-card__title"></div>
      <div class="skeleton skeleton-card__line"></div>
      <div class="skeleton skeleton-card__line skeleton-card__line--short"></div>
      <div class="skeleton-card__meta">
        <div class="skeleton skeleton-card__chip"></div>
        <div class="skeleton skeleton-card__time"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  overflow: hidden;
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
}

.skeleton-card__media {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 0;
}

.skeleton-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
}

.skeleton-card__title {
  height: 18px;
  width: 60%;
}

.skeleton-card__line {
  height: 12px;
  width: 100%;
}

.skeleton-card__line--short {
  width: 72%;
}

.skeleton-card__meta {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-1);
}

.skeleton-card__chip {
  height: 20px;
  width: 64px;
  border-radius: var(--radius-pill);
}

.skeleton-card__time {
  height: 12px;
  width: 48px;
}
</style>
