<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { onAuthExpired } from '@/utils/auth-events'

const router = useRouter()
const userStore = useUserStore()

let stopAuthExpiredListener: (() => void) | undefined

onMounted(() => {
  stopAuthExpiredListener = onAuthExpired(handleAuthExpired)
})

onBeforeUnmount(() => {
  stopAuthExpiredListener?.()
})

/**
 * 非静默请求返回 401 时（请求层只广播事件，不操作 store 与路由）：
 * 清空本地凭证并回到登录页。
 */
async function handleAuthExpired(): Promise<void> {
  const currentRoute = router.currentRoute.value
  // 登录页自身的 401 不应触发清理；未登录状态也无需重复跳转，避免重定向循环
  if (currentRoute.name === 'userLogin' || !userStore.isLoggedIn) return

  userStore.clearSession()
  ElMessage.warning('登录状态已失效，请重新登录')
  await router.replace({ name: 'userLogin', query: { redirect: currentRoute.fullPath } })
}
</script>

<template>
  <router-view />
</template>

<style scoped></style>
