/**
 * 会话失效事件。
 *
 * `api/http.ts` 只在收到 401 时广播，不直接操作 store 与 router —— 请求层反向依赖
 * 业务层会形成循环引用。真正的清理与跳转由 `App.vue` 订阅后统一处理。
 */
export const authExpiredEventName = 'lostFound:authExpired'

/** 订阅会话失效，返回取消订阅函数 */
export function onAuthExpired(handler: () => void): () => void {
  window.addEventListener(authExpiredEventName, handler)
  return () => {
    window.removeEventListener(authExpiredEventName, handler)
  }
}

/** 广播一次会话失效 */
export function emitAuthExpired(): void {
  window.dispatchEvent(new Event(authExpiredEventName))
}
