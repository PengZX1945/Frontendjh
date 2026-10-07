import { ref } from 'vue'

export interface ConfirmRequest {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  /** 危险操作（删除、退出）用红色确认按钮 */
  danger?: boolean
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (isConfirmed: boolean) => void
}

const pendingConfirm = ref<PendingConfirm | null>(null)

/** 当前待处理的确认框（confirm-dialog.vue 消费） */
export function usePendingConfirm() {
  return pendingConfirm
}

/**
 * 打开一个确认框，返回用户是否确认。
 * 用它替代原生 `window.confirm`，保留统一的视觉与焦点管理。
 */
export function requestConfirm(request: ConfirmRequest): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    pendingConfirm.value = { ...request, resolve }
  })
}

/** 由确认框组件回调 */
export function settleConfirm(isConfirmed: boolean): void {
  const current = pendingConfirm.value
  pendingConfirm.value = null
  current?.resolve(isConfirmed)
}
