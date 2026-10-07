<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import AdminTabs from '@/components/admin-tabs.vue'
import EmptyState from '@/components/empty-state.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import StatusPill from '@/components/status-pill.vue'
import { fetchManagedUsers, updateUserRole } from '@/api/auth-api'
import { userRoleMeta } from '@/constants/domain'
import { usePagedRecords } from '@/composables/use-paged-records'
import { useUserStore } from '@/stores/user'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { roleLabel, roleTone } from '@/utils/user-role'
import type { StatusTone } from '@/constants/domain'
import type { ManagedUser, UserRole } from '@/types/user'

/**
 * 用户管理（系统管理员）。
 * 接口约定：不允许改动其他 sys_admin 的角色，也不允许降级自己 —— 这两种情况按钮直接禁用，
 * 免得用户点出一个必然失败的请求。
 */
const userStore = useUserStore()
const userPageSize = 12

const keywordFilter = ref('')
const keywordDraft = ref('')
const roleFilter = ref<UserRole | ''>('')
const busyUserId = ref<number | null>(null)
let keywordTimer: number | undefined

const roleFilterOptions: UserRole[] = ['user', 'finder_admin', 'sys_admin']

const { records, hasMore, isInitialLoading, isLoadingMore, errorMessage, loadNextPage, refresh } =
  usePagedRecords<ManagedUser>((page) =>
    fetchManagedUsers({
      keyword: keywordFilter.value,
      role: roleFilter.value === '' ? undefined : roleFilter.value,
      page,
      pageSize: userPageSize,
    }),
  )

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

function roleToneValue(role: UserRole): StatusTone {
  return roleTone(role) as StatusTone
}

/** 是否允许调整该用户的角色 */
function canChangeRole(user: ManagedUser): boolean {
  if (user.role === 'sys_admin') return false
  if (user.userId === userStore.currentUserId) return false
  return true
}

function scheduleKeywordSearch(): void {
  window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => {
    keywordFilter.value = keywordDraft.value.trim()
  }, 350)
}

async function handleChangeRole(user: ManagedUser, nextRole: UserRole): Promise<void> {
  const isGranting = nextRole === 'finder_admin'
  const isConfirmed = await requestConfirm({
    title: isGranting ? '授予管理员权限' : '撤销管理员权限',
    message: isGranting
      ? `将「${user.nickname || user.username}」设为失物招领管理员，可审核发布与审批认领。确定？`
      : `将「${user.nickname || user.username}」改回普通用户，管理员入口会立即失效。确定？`,
    confirmText: isGranting ? '授予' : '撤销',
    danger: !isGranting,
  })
  if (!isConfirmed) return

  busyUserId.value = user.userId
  try {
    await updateUserRole(user.userId, nextRole, { silent: true })
    showSuccessToast(isGranting ? '已授予管理员权限' : '已撤销管理员权限')
    await refresh()
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  } finally {
    busyUserId.value = null
  }
}

watch(
  [keywordFilter, roleFilter],
  () => {
    void refresh()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.clearTimeout(keywordTimer)
})
</script>

<template>
  <div class="admin-users page-section">
    <div class="content-container">
      <header class="admin-users__header">
        <p class="eyebrow">管理台</p>
        <h1 class="section-title">用户管理</h1>
        <p class="lead">把信任的同学设为失物招领管理员，让他们分担审核与认领审批。</p>
      </header>

      <AdminTabs />

      <div class="admin-users__filters surface-card">
        <input
          v-model="keywordDraft"
          class="input"
          type="search"
          placeholder="搜索用户名或昵称…"
          @input="scheduleKeywordSearch"
        />
        <div class="admin-users__chips">
          <button
            type="button"
            class="chip"
            :class="{ 'chip--active': roleFilter === '' }"
            @click="roleFilter = ''"
          >
            全部角色
          </button>
          <button
            v-for="option in roleFilterOptions"
            :key="option"
            type="button"
            class="chip"
            :class="{ 'chip--active': roleFilter === option }"
            @click="roleFilter = option"
          >
            {{ userRoleMeta[option].label }}
          </button>
        </div>
      </div>

      <div v-if="isInitialLoading" class="admin-users__list">
        <div v-for="index in 4" :key="index" class="skeleton admin-users__skeleton"></div>
      </div>

      <div v-else-if="records.length > 0" class="admin-users__list">
        <article v-for="user in records" :key="user.userId" class="user-row">
          <div class="user-row__identity">
            <span class="user-row__avatar" aria-hidden="true">
              {{ (user.nickname || user.username || '·').slice(0, 1).toUpperCase() }}
            </span>
            <div>
              <p class="user-row__name">
                {{ user.nickname || '未设置昵称' }}
                <span v-if="user.userId === userStore.currentUserId" class="user-row__self"
                  >（我）</span
                >
              </p>
              <p class="user-row__username">@{{ user.username }} · #{{ user.userId }}</p>
            </div>
          </div>

          <div class="user-row__meta">
            <StatusPill :label="roleLabel(user.role)" :tone="roleToneValue(user.role)" />
            <span class="user-row__contact">{{ user.contact || '未填写联系方式' }}</span>
          </div>

          <div class="user-row__actions">
            <template v-if="canChangeRole(user)">
              <button
                v-if="user.role === 'user'"
                type="button"
                class="btn btn--small btn--primary"
                :disabled="busyUserId === user.userId"
                @click="handleChangeRole(user, 'finder_admin')"
              >
                设为失物招领管理员
              </button>
              <button
                v-else
                type="button"
                class="btn btn--small btn--quiet"
                :disabled="busyUserId === user.userId"
                @click="handleChangeRole(user, 'user')"
              >
                撤销管理员权限
              </button>
            </template>
            <span v-else class="user-row__locked">
              {{ user.role === 'sys_admin' ? '系统管理员角色不可调整' : '不能调整自己的角色' }}
            </span>
          </div>
        </article>
      </div>

      <EmptyState
        v-else-if="errorMessage === ''"
        title="没有匹配的用户"
        message="换个关键词或角色筛选再看看。"
      />

      <EmptyState v-else title="这次没能取到数据" :message="errorMessage">
        <button type="button" class="btn btn--primary" @click="refresh()">重新加载</button>
      </EmptyState>

      <InfiniteSentinel
        v-if="records.length > 0"
        :disabled="isSentinelDisabled"
        @reach="loadNextPage"
      />
      <LoadMoreIndicator
        v-if="records.length > 0"
        :is-loading="isLoadingMore"
        :has-more="hasMore"
        :error-message="errorMessage"
        empty-hint="已列出全部用户"
        @retry="loadNextPage"
      />
    </div>
  </div>
</template>

<style scoped>
.admin-users__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.admin-users__filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
}

.admin-users__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.admin-users__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.admin-users__skeleton {
  height: 84px;
  border-radius: var(--radius-lg);
}

.user-row {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
  align-items: center;
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
}

.user-row__identity {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-width: 0;
}

.user-row__avatar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--surface-sunken-strong);
  font-size: 15px;
  font-weight: 600;
}

.user-row__name {
  font-weight: 600;
}

.user-row__self {
  color: var(--ink-tertiary);
  font-size: 13px;
  font-weight: 400;
}

.user-row__username {
  color: var(--ink-tertiary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.user-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
}

.user-row__contact {
  overflow: hidden;
  color: var(--ink-secondary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-row__actions {
  display: flex;
  justify-content: flex-end;
}

.user-row__locked {
  color: var(--ink-tertiary);
  font-size: 13px;
}

@media (max-width: 820px) {
  .user-row {
    grid-template-columns: 1fr;
  }

  .user-row__actions {
    justify-content: flex-start;
  }
}
</style>
