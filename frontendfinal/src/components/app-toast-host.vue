<script setup lang="ts">
import { useToastMessages, dismissToast } from '@/composables/use-toast'

/** 全局轻提示宿主：固定在底部居中，自动消失，不阻塞操作 */
const toasts = useToastMessages()
</script>

<template>
  <div class="toast-host" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="{
          'toast--error': toast.tone === 'error',
          'toast--success': toast.tone === 'success',
        }"
        role="status"
        @click="dismissToast(toast.id)"
      >
        {{ toast.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
</style>
