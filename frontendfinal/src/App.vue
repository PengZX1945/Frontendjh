<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppHeader from '@/components/app-header.vue'
import AppFooter from '@/components/app-footer.vue'
import AppToastHost from '@/components/app-toast-host.vue'
import ConfirmDialog from '@/components/confirm-dialog.vue'
import { useUserStore } from '@/stores/user'
import { onAuthExpired } from '@/utils/auth-events'
import { showErrorToast } from '@/composables/use-toast'
import { authExpiredMessage } from '@/utils/error-message'

/**
 * 应用外壳：顶栏 + 路由出口 + 页脚 + 全局浮层。
 *
 * 会话失效的唯一处置点也在这里 —— 请求层只在收到 401 / 业务码 2 时广播事件，
 * 由这里清空凭证、提示一次、带 `redirect` 回登录页。
 */
const router = useRouter()
const userStore = useUserStore()

let stopAuthExpiredListener: (() => void) | undefined

async function handleAuthExpired(): Promise<void> {
  const currentRoute = router.currentRoute.value
  // 已在登录页、或本来就未登录时不必再跳，避免重定向循环
  if (currentRoute.name === 'userLogin' || !userStore.isLoggedIn) return

  userStore.clearSession()
  showErrorToast(authExpiredMessage)
  await router.replace({ name: 'userLogin', query: { redirect: currentRoute.fullPath } })
}

onMounted(() => {
  stopAuthExpiredListener = onAuthExpired(() => {
    void handleAuthExpired()
  })
})

onBeforeUnmount(() => {
  stopAuthExpiredListener?.()
})
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter />

    <AppToastHost />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--surface-canvas);
}

.app-main {
  flex: 1;
}
</style>
