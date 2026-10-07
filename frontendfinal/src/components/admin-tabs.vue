<script setup lang="ts">
import { computed } from 'vue'

import { useUserStore } from '@/stores/user'

/** 管理台内的横向切换：按角色裁剪可见入口 */
const userStore = useUserStore()

interface AdminTab {
  label: string
  to: { name: string }
  systemAdminOnly: boolean
}

const allTabs: AdminTab[] = [
  { label: '发布审核', to: { name: 'adminReview' }, systemAdminOnly: false },
  { label: '认领审批', to: { name: 'adminClaims' }, systemAdminOnly: false },
  { label: '全校总览', to: { name: 'adminItems' }, systemAdminOnly: true },
  { label: '公告管理', to: { name: 'adminAnnouncements' }, systemAdminOnly: true },
  { label: '用户管理', to: { name: 'adminUsers' }, systemAdminOnly: true },
]

const visibleTabs = computed(() =>
  allTabs.filter((tab) => !tab.systemAdminOnly || userStore.isSystemAdmin),
)
</script>

<template>
  <nav class="admin-tabs" aria-label="管理台导航">
    <RouterLink
      v-for="tab in visibleTabs"
      :key="tab.label"
      class="chip"
      :to="tab.to"
      active-class="chip--active"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.admin-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}
</style>
