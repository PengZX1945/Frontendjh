import { ref } from 'vue'

/** 轻提示类型 */
export type ToastTone = 'info' | 'success' | 'error'

export interface ToastMessage {
  id: number
  tone: ToastTone
  text: string
}

const toasts = ref<ToastMessage[]>([])
let nextToastId = 1

/** 当前待展示的轻提示（app-toast-host 消费） */
export function useToastMessages() {
  return toasts
}

function pushToast(tone: ToastTone, text: string, duration: number): void {
  const id = nextToastId
  nextToastId += 1
  toasts.value = [...toasts.value, { id, tone, text }]
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }, duration)
}

export function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

/**
 * 全局轻提示。
 * 请求层用它弹默认错误（除非调用方传了 `silent`，改由页面内联展示）。
 */
export function showToast(text: string, tone: ToastTone = 'info', duration = 3200): void {
  pushToast(tone, text, duration)
}

export function showSuccessToast(text: string): void {
  pushToast('success', text, 2600)
}

export function showErrorToast(text: string): void {
  pushToast('error', text, 4000)
}
