<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useUserStore } from '@/stores/user'
import { requestConfirm } from '@/composables/use-confirm'
import { showSuccessToast } from '@/composables/use-toast'
import { roleLabel } from '@/utils/user-role'

/** 顶部导航：毛玻璃吸顶，当前页用下划线指示 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isMenuOpen = ref(false)
const isMobilePanelOpen = ref(false)

interface NavLink {
  label: string
  to: { name: string; params?: Record<string, string> }
}

const navLinks: NavLink[] = [
  { label: '寻物启事', to: { name: 'itemFeed', params: { type: 'lost' } } },
  { label: '失物招领', to: { name: 'itemFeed', params: { type: 'found' } } },
  { label: '公告', to: { name: 'announcementList' } },
]

/** 导航高亮：同名路由还要比参数，否则「寻物启事 / 失物招领」会同时点亮 */
function isNavLinkActive(link: NavLink): boolean {
  if (route.name !== link.to.name) return false
  if (link.to.params === undefined) return true
  return Object.entries(link.to.params).every(([key, value]) => route.params[key] === value)
}

const avatarLetter = computed(() => {
  const name = userStore.displayName
  return name === '未登录' ? '·' : name.slice(0, 1).toUpperCase()
})

const accountLinks = computed(() => {
  const links: NavLink[] = [
    { label: '个人中心', to: { name: 'userProfile' } },
    { label: '我的发布', to: { name: 'myItems' } },
    { label: '我的认领', to: { name: 'myClaims' } },
  ]
  if (userStore.isBackOffice) {
    links.push({ label: '发布审核', to: { name: 'adminReview' } })
    links.push({ label: '认领审批', to: { name: 'adminClaims' } })
  }
  if (userStore.isSystemAdmin) {
    links.push({ label: '全校总览', to: { name: 'adminItems' } })
    links.push({ label: '公告管理', to: { name: 'adminAnnouncements' } })
    links.push({ label: '用户管理', to: { name: 'adminUsers' } })
  }
  return links
})

function closeMenus(): void {
  isMenuOpen.value = false
  isMobilePanelOpen.value = false
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('.user-menu') !== null) return
  isMenuOpen.value = false
}

async function handleSignOut(): Promise<void> {
  isMenuOpen.value = false
  const isConfirmed = await requestConfirm({
    title: '退出登录',
    message: '退出后需要重新登录才能发布与认领，确定退出当前账号？',
    confirmText: '退出登录',
    danger: true,
  })
  if (!isConfirmed) return

  await userStore.signOut()
  showSuccessToast('已退出登录')
  await router.push({ name: 'itemFeed', params: { type: 'lost' } })
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <header class="app-header">
    <div class="content-container app-header__bar">
      <RouterLink
        class="brand"
        :to="{ name: 'itemFeed', params: { type: 'lost' } }"
        @click="closeMenus"
      >
        <span class="brand__mark" aria-hidden="true">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
          >
            <path
              d="M12.6 21.4a4.6 4.6 0 0 1-1.3-3.2c0-1.2.5-2.3 1.3-3.2l3.4-3.4a4.5 4.5 0 0 1 6.4 0"
            />
            <path
              d="M19.4 10.6a4.6 4.6 0 0 1 1.3 3.2c0 1.2-.5 2.3-1.3 3.2l-3.4 3.4a4.5 4.5 0 0 1-6.4 0"
            />
          </svg>
        </span>
        <span class="brand__text">校园失物招领</span>
      </RouterLink>

      <nav class="app-header__nav" aria-label="主导航">
        <RouterLink
          v-for="link in navLinks"
          :key="link.label"
          class="nav-link"
          :class="{ 'nav-link--active': isNavLinkActive(link) }"
          :to="link.to"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="app-header__actions">
        <RouterLink class="btn btn--primary btn--small" :to="{ name: 'itemPublish' }"
          >发布信息</RouterLink
        >

        <div v-if="userStore.isLoggedIn" class="user-menu">
          <button
            type="button"
            class="user-menu__trigger"
            :aria-expanded="isMenuOpen"
            aria-haspopup="menu"
            @click="isMenuOpen = !isMenuOpen"
          >
            <span class="user-menu__avatar" aria-hidden="true">{{ avatarLetter }}</span>
            <span class="user-menu__name">{{ userStore.displayName }}</span>
            <svg
              class="user-menu__caret"
              viewBox="0 0 12 8"
              width="10"
              height="7"
              aria-hidden="true"
            >
              <path fill="none" stroke="currentColor" stroke-width="1.6" d="M1 1.5 6 6.5l5-5" />
            </svg>
          </button>

          <Transition name="menu">
            <div v-if="isMenuOpen" class="user-menu__panel" role="menu">
              <div class="user-menu__header">
                <p class="user-menu__header-name">{{ userStore.displayName }}</p>
                <p class="user-menu__header-role">{{ roleLabel(userStore.role) }}</p>
              </div>
              <RouterLink
                v-for="link in accountLinks"
                :key="link.label"
                class="user-menu__item"
                role="menuitem"
                :to="link.to"
                @click="closeMenus"
              >
                {{ link.label }}
              </RouterLink>
              <button
                type="button"
                class="user-menu__item user-menu__item--danger"
                role="menuitem"
                @click="handleSignOut"
              >
                退出登录
              </button>
            </div>
          </Transition>
        </div>

        <template v-else>
          <RouterLink class="btn btn--ghost btn--small" :to="{ name: 'userLogin' }"
            >登录</RouterLink
          >
          <RouterLink class="btn btn--quiet btn--small" :to="{ name: 'userRegister' }"
            >注册</RouterLink
          >
        </template>

        <button
          type="button"
          class="app-header__toggle"
          :aria-expanded="isMobilePanelOpen"
          aria-label="展开导航"
          @click="isMobilePanelOpen = !isMobilePanelOpen"
        >
          <svg viewBox="0 0 20 14" width="20" height="14" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              d="M1 1h18M1 7h18M1 13h18"
            />
          </svg>
        </button>
      </div>
    </div>

    <Transition name="menu">
      <div v-if="isMobilePanelOpen" class="app-header__mobile-panel">
        <RouterLink
          v-for="link in navLinks"
          :key="link.label"
          class="app-header__mobile-link"
          :to="link.to"
          @click="closeMenus"
        >
          {{ link.label }}
        </RouterLink>
        <template v-if="userStore.isLoggedIn">
          <RouterLink
            v-for="link in accountLinks"
            :key="link.label"
            class="app-header__mobile-link"
            :to="link.to"
            @click="closeMenus"
          >
            {{ link.label }}
          </RouterLink>
          <button
            type="button"
            class="app-header__mobile-link app-header__mobile-link--danger"
            @click="handleSignOut"
          >
            退出登录
          </button>
        </template>
        <template v-else>
          <RouterLink
            class="app-header__mobile-link"
            :to="{ name: 'userLogin' }"
            @click="closeMenus"
            >登录</RouterLink
          >
          <RouterLink
            class="app-header__mobile-link"
            :to="{ name: 'userRegister' }"
            @click="closeMenus"
            >注册</RouterLink
          >
        </template>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--line-hairline);
  background: var(--surface-glass);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}

.app-header__bar {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  height: var(--layout-header-height);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--ink-primary);
  font-weight: 600;
  letter-spacing: -0.015em;
  white-space: nowrap;
}

.brand:hover {
  text-decoration: none;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
}

.brand__mark svg {
  width: 18px;
  height: 18px;
}

.app-header__nav {
  display: flex;
  gap: var(--space-1);
  margin-left: var(--space-4);
}

.nav-link {
  position: relative;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  color: var(--ink-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: color var(--duration-fast) var(--ease-standard);
}

.nav-link:hover {
  color: var(--ink-primary);
  text-decoration: none;
}

.nav-link--active {
  color: var(--ink-primary);
}

.nav-link--active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
}

.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.user-menu {
  position: relative;
}

.user-menu__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px 10px 4px 4px;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}

.user-menu__trigger:hover {
  background: var(--surface-sunken);
}

.user-menu__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--ink-primary);
  color: var(--ink-inverse);
  font-size: 13px;
  font-weight: 600;
}

.user-menu__name {
  max-width: 120px;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu__caret {
  color: var(--ink-tertiary);
}

.user-menu__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  min-width: 208px;
  padding: var(--space-2);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-md);
  background: var(--surface-canvas);
  box-shadow: var(--shadow-raised);
}

.user-menu__header {
  padding: var(--space-2) var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--line-hairline);
  margin-bottom: var(--space-2);
}

.user-menu__header-name {
  font-size: 15px;
  font-weight: 600;
}

.user-menu__header-role {
  margin-top: 2px;
  color: var(--ink-tertiary);
  font-size: 12px;
}

.user-menu__item {
  display: block;
  width: 100%;
  padding: 9px var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-primary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-standard);
}

.user-menu__item:hover {
  background: var(--surface-sunken);
  text-decoration: none;
}

.user-menu__item--danger {
  color: var(--danger);
}

.app-header__toggle {
  display: none;
  padding: 6px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-primary);
  cursor: pointer;
}

.app-header__mobile-panel {
  display: none;
  flex-direction: column;
  padding: var(--space-2) var(--layout-gutter) var(--space-4);
  border-top: 1px solid var(--line-hairline);
}

.app-header__mobile-link {
  padding: 12px var(--space-2);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-primary);
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}

.app-header__mobile-link:hover {
  background: var(--surface-sunken);
  text-decoration: none;
}

.app-header__mobile-link--danger {
  color: var(--danger);
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 860px) {
  .app-header__nav,
  .app-header__actions > .btn,
  .user-menu {
    display: none;
  }

  .app-header__toggle {
    display: inline-flex;
  }

  .app-header__mobile-panel {
    display: flex;
  }
}
</style>
