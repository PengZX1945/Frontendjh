/**
 * 鉴权失效事件。
 *
 * 请求层（api/http.ts）只负责「广播」401，不直接操作 store 与路由，
 * 避免请求层反向依赖业务层形成循环引用；真正的清理与跳转由 App.vue 统一处理。
 */
export const authExpiredEventName = 'lostFound:authExpired'

/** 广播「登录状态已失效」 */
export function emitAuthExpired(): void {
  window.dispatchEvent(new Event(authExpiredEventName))
}

/** 订阅上述事件，返回取消订阅的函数 */
export function onAuthExpired(handleAuthExpired: () => void): () => void {
  window.addEventListener(authExpiredEventName, handleAuthExpired)
  return () => window.removeEventListener(authExpiredEventName, handleAuthExpired)
}
