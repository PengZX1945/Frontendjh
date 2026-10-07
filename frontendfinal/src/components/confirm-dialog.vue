<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { settleConfirm, usePendingConfirm } from '@/composables/use-confirm'

/** 确认框：以 Promise 形态暴露给业务代码（见 composables/use-confirm.ts） */
const pendingConfirm = usePendingConfirm()
const confirmButton = ref<HTMLButtonElement | null>(null)

function handleCancel(): void {
  settleConfirm(false)
}

function handleConfirm(): void {
  settleConfirm(true)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') handleCancel()
}

watch(pendingConfirm, (next) => {
  if (next !== null) {
    // 打开时把焦点交给确认按钮，键盘用户可直接回车
    window.setTimeout(() => confirmButton.value?.focus(), 0)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="pendingConfirm !== null" class="overlay" @click.self="handleCancel">
        <div
          class="confirm-card"
          role="alertdialog"
          aria-modal="true"
          :aria-label="pendingConfirm.title"
        >
          <h2 class="confirm-card__title">{{ pendingConfirm.title }}</h2>
          <p class="confirm-card__message">{{ pendingConfirm.message }}</p>
          <div class="confirm-card__actions">
            <button type="button" class="btn btn--ghost" @click="handleCancel">
              {{ pendingConfirm.cancelText ?? '取消' }}
            </button>
            <button
              ref="confirmButton"
              type="button"
              class="btn"
              :class="pendingConfirm.danger ? 'btn--primary confirm-card__danger' : 'btn--primary'"
              @click="handleConfirm"
            >
              {{ pendingConfirm.confirmText ?? '确定' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-card {
  width: min(420px, 100%);
  padding: var(--space-8);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
  box-shadow: var(--shadow-float);
  text-align: center;
}

.confirm-card__title {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.confirm-card__message {
  margin-top: var(--space-3);
  color: var(--ink-secondary);
  font-size: 15px;
  line-height: 1.55;
}

.confirm-card__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  margin-top: var(--space-8);
}

.confirm-card__actions .btn {
  min-width: 96px;
}

.confirm-card__danger {
  background: var(--danger);
}

.confirm-card__danger:hover:not(:disabled) {
  background: #bd0012;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity var(--duration-fast) var(--ease-standard);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
</style>
