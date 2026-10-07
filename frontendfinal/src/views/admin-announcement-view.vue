<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AdminTabs from '@/components/admin-tabs.vue'
import EmptyState from '@/components/empty-state.vue'
import StatusPill from '@/components/status-pill.vue'
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAllAnnouncements,
  updateAnnouncement,
  updateAnnouncementStatus,
} from '@/api/announcement-api'
import { announcementStatusMeta } from '@/constants/domain'
import { usePagedRecords } from '@/composables/use-paged-records'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { formatDateTime } from '@/utils/date-format'
import { validateAnnouncementContent, validateAnnouncementTitle } from '@/utils/validators'
import type { AnnouncementRecord } from '@/types/announcement'

/**
 * 公告管理（系统管理员）。
 * 上/下线走 `updateAnnouncementStatus`，字段假设见该函数的注释。
 */
const announcementPageSize = 10

const form = reactive({ title: '', content: '' })
const formErrors = reactive<Record<string, string>>({})
const formError = ref('')
const isSubmitting = ref(false)

const editingId = ref<number | null>(null)
const editingForm = reactive({ title: '', content: '' })
const editingError = ref('')
const isSavingEdit = ref(false)
const busyId = ref<number | null>(null)

const {
  records,
  hasMore,
  isInitialLoading,
  isLoadingMore,
  errorMessage,
  loadNextPage,
  refresh,
  removeRecord,
} = usePagedRecords<AnnouncementRecord>((page) =>
  fetchAllAnnouncements({ page, pageSize: announcementPageSize }),
)

async function handleCreate(): Promise<void> {
  for (const key of Object.keys(formErrors)) delete formErrors[key]
  const titleError = validateAnnouncementTitle(form.title)
  if (titleError !== '') formErrors.title = titleError
  const contentError = validateAnnouncementContent(form.content)
  if (contentError !== '') formErrors.content = contentError
  if (Object.keys(formErrors).length > 0) return

  isSubmitting.value = true
  formError.value = ''
  try {
    await createAnnouncement(
      { title: form.title.trim(), content: form.content.trim() },
      { silent: true },
    )
    form.title = ''
    form.content = ''
    showSuccessToast('公告已发布')
    await refresh()
  } catch (error) {
    formError.value = resolveErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

function startEditing(announcement: AnnouncementRecord): void {
  editingId.value = announcement.announcementId
  editingForm.title = announcement.title
  editingForm.content = announcement.content
  editingError.value = ''
}

function cancelEditing(): void {
  editingId.value = null
  editingError.value = ''
}

async function handleSaveEdit(announcement: AnnouncementRecord): Promise<void> {
  const titleError = validateAnnouncementTitle(editingForm.title)
  const contentError = validateAnnouncementContent(editingForm.content)
  if (titleError !== '' || contentError !== '') {
    editingError.value = titleError !== '' ? titleError : contentError
    return
  }

  isSavingEdit.value = true
  editingError.value = ''
  try {
    await updateAnnouncement(
      announcement.announcementId,
      { title: editingForm.title.trim(), content: editingForm.content.trim() },
      { silent: true },
    )
    cancelEditing()
    showSuccessToast('公告已更新')
    await refresh()
  } catch (error) {
    editingError.value = resolveErrorMessage(error)
  } finally {
    isSavingEdit.value = false
  }
}

async function handleToggleStatus(announcement: AnnouncementRecord): Promise<void> {
  const nextStatus = announcement.announcementStatus === 0 ? 1 : 0
  const isConfirmed = await requestConfirm({
    title: nextStatus === 1 ? '下线公告' : '重新发布公告',
    message:
      nextStatus === 1
        ? '下线后这条公告不再出现在公开列表。确定下线？'
        : '重新发布后这条公告会回到公开列表。确定发布？',
    confirmText: nextStatus === 1 ? '下线' : '重新发布',
  })
  if (!isConfirmed) return

  busyId.value = announcement.announcementId
  try {
    await updateAnnouncementStatus(announcement, nextStatus, { silent: true })
    showSuccessToast(nextStatus === 1 ? '公告已下线' : '公告已重新发布')
    await refresh()
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  } finally {
    busyId.value = null
  }
}

async function handleDelete(announcement: AnnouncementRecord): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '删除公告',
    message: `「${announcement.title}」删除后无法恢复。确定删除？`,
    confirmText: '删除',
    danger: true,
  })
  if (!isConfirmed) return

  busyId.value = announcement.announcementId
  try {
    await deleteAnnouncement(announcement.announcementId, { silent: true })
    removeRecord((record) => record.announcementId === announcement.announcementId)
    showSuccessToast('公告已删除')
  } catch (error) {
    showErrorToast(resolveErrorMessage(error))
  } finally {
    busyId.value = null
  }
}

onMounted(() => {
  void refresh()
})
</script>

<template>
  <div class="admin-announcement page-section">
    <div class="content-container">
      <header class="admin-announcement__header">
        <p class="eyebrow">管理台</p>
        <h1 class="section-title">公告管理</h1>
        <p class="lead">发布全校可见的通知，也可以把过期公告下线而不删除记录。</p>
      </header>

      <AdminTabs />

      <section class="admin-announcement__composer surface-card">
        <h2 class="block-title">发布新公告</h2>
        <p v-if="formError !== ''" class="auth-notice auth-notice--error">{{ formError }}</p>

        <form class="admin-announcement__form" novalidate @submit.prevent="handleCreate">
          <div class="field">
            <label class="field__label field__label-required" for="announcement-title">标题</label>
            <input
              id="announcement-title"
              v-model="form.title"
              class="input"
              :class="{ 'input--invalid': (formErrors.title ?? '') !== '' }"
              type="text"
              placeholder="例如：失物招领处国庆假期值班安排"
            />
            <p v-if="(formErrors.title ?? '') !== ''" class="field__error">
              {{ formErrors.title }}
            </p>
          </div>

          <div class="field">
            <label class="field__label field__label-required" for="announcement-content"
              >正文</label
            >
            <textarea
              id="announcement-content"
              v-model="form.content"
              class="textarea"
              :class="{ 'textarea--invalid': (formErrors.content ?? '') !== '' }"
              rows="6"
              placeholder="支持换行，换行会按原样展示给读者。"
            ></textarea>
            <p v-if="(formErrors.content ?? '') !== ''" class="field__error">
              {{ formErrors.content }}
            </p>
          </div>

          <div class="admin-announcement__form-actions">
            <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
              {{ isSubmitting ? '发布中…' : '发布公告' }}
            </button>
          </div>
        </form>
      </section>

      <section class="admin-announcement__list-section">
        <h2 class="block-title">全部公告</h2>

        <div v-if="isInitialLoading" class="admin-announcement__list">
          <div v-for="index in 3" :key="index" class="skeleton admin-announcement__skeleton"></div>
        </div>

        <div v-else-if="records.length > 0" class="admin-announcement__list">
          <article
            v-for="announcement in records"
            :key="announcement.announcementId"
            class="announcement-row"
          >
            <div class="announcement-row__main">
              <div class="announcement-row__head">
                <StatusPill
                  :label="announcementStatusMeta[announcement.announcementStatus].label"
                  :tone="announcementStatusMeta[announcement.announcementStatus].tone"
                />
                <span class="announcement-row__id">#{{ announcement.announcementId }}</span>
                <span class="announcement-row__time">{{
                  formatDateTime(announcement.createdTime)
                }}</span>
              </div>
              <h3 class="announcement-row__title">{{ announcement.title }}</h3>
              <p class="announcement-row__content">{{ announcement.content }}</p>
            </div>

            <div class="announcement-row__actions">
              <RouterLink
                class="btn btn--small btn--ghost"
                :to="{
                  name: 'announcementDetail',
                  params: { announcementId: String(announcement.announcementId) },
                }"
              >
                预览
              </RouterLink>
              <button
                type="button"
                class="btn btn--small btn--quiet"
                @click="startEditing(announcement)"
              >
                编辑
              </button>
              <button
                type="button"
                class="btn btn--small btn--quiet"
                :disabled="busyId === announcement.announcementId"
                @click="handleToggleStatus(announcement)"
              >
                {{ announcement.announcementStatus === 0 ? '下线' : '重新发布' }}
              </button>
              <button
                type="button"
                class="btn btn--small btn--danger"
                :disabled="busyId === announcement.announcementId"
                @click="handleDelete(announcement)"
              >
                删除
              </button>
            </div>

            <form
              v-if="editingId === announcement.announcementId"
              class="announcement-row__editor"
              @submit.prevent="handleSaveEdit(announcement)"
            >
              <div class="field">
                <label class="field__label">标题</label>
                <input v-model="editingForm.title" class="input" type="text" />
              </div>
              <div class="field">
                <label class="field__label">正文</label>
                <textarea v-model="editingForm.content" class="textarea" rows="5"></textarea>
              </div>
              <p v-if="editingError !== ''" class="field__error">{{ editingError }}</p>
              <div class="announcement-row__editor-actions">
                <button type="button" class="btn btn--small btn--ghost" @click="cancelEditing">
                  取消
                </button>
                <button type="submit" class="btn btn--small btn--primary" :disabled="isSavingEdit">
                  {{ isSavingEdit ? '保存中…' : '保存' }}
                </button>
              </div>
            </form>
          </article>
        </div>

        <EmptyState
          v-else-if="errorMessage === ''"
          title="还没有公告"
          message="用上面的表单发布第一条公告。"
        />

        <EmptyState v-else title="这次没能取到数据" :message="errorMessage">
          <button type="button" class="btn btn--primary" @click="refresh()">重新加载</button>
        </EmptyState>

        <button
          v-if="hasMore && !isInitialLoading"
          type="button"
          class="btn btn--quiet admin-announcement__more"
          :disabled="isLoadingMore"
          @click="loadNextPage"
        >
          {{ isLoadingMore ? '加载中…' : '加载更多' }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.admin-announcement__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.admin-announcement__composer {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
  margin-bottom: var(--space-10);
}

.admin-announcement__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.admin-announcement__form-actions {
  display: flex;
  justify-content: flex-end;
}

.admin-announcement__list-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-announcement__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-announcement__skeleton {
  height: 128px;
  border-radius: var(--radius-lg);
}

.announcement-row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  padding: var(--space-5);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-lg);
  background: var(--surface-canvas);
}

.announcement-row__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.announcement-row__head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.announcement-row__id {
  color: var(--ink-tertiary);
  font-family: var(--font-mono);
  font-size: 12px;
}

.announcement-row__time {
  color: var(--ink-tertiary);
  font-size: 13px;
}

.announcement-row__title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.announcement-row__content {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink-secondary);
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.announcement-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: flex-end;
  max-width: 240px;
}

.announcement-row__editor {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}

.announcement-row__editor-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.admin-announcement__more {
  align-self: center;
}

@media (max-width: 820px) {
  .announcement-row {
    grid-template-columns: 1fr;
  }

  .announcement-row__actions {
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
