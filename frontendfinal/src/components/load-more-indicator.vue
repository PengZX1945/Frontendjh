<script setup lang="ts">
/** 列表底部状态：加载中 / 已到末页 / 加载失败可重试 */
defineProps<{
  isLoading: boolean
  hasMore: boolean
  errorMessage?: string
  emptyHint?: string
}>()

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="load-more">
    <template v-if="errorMessage">
      <p class="load-more__error">{{ errorMessage }}</p>
      <button type="button" class="btn btn--small btn--quiet" @click="emit('retry')">重试</button>
    </template>
    <template v-else-if="isLoading">
      <span class="load-more__spinner" aria-hidden="true"></span>
      <span class="load-more__text">正在加载更多…</span>
    </template>
    <p v-else-if="!hasMore" class="load-more__text load-more__text--muted">
      {{ emptyHint ?? '已经到底了' }}
    </p>
  </div>
</template>

<style scoped>
.load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-10) 0 var(--space-4);
}

.load-more__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--line-strong);
  border-top-color: var(--ink-secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.load-more__text {
  color: var(--ink-secondary);
  font-size: 14px;
}

.load-more__text--muted {
  color: var(--ink-tertiary);
}

.load-more__error {
  color: var(--danger);
  font-size: 14px;
}
</style>
