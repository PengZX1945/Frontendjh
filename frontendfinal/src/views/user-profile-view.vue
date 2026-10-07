<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import StatusPill from '@/components/status-pill.vue'
import { useUserStore } from '@/stores/user'
import { requestConfirm } from '@/composables/use-confirm'
import { showErrorToast, showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import { roleLabel, roleTone } from '@/utils/user-role'
import type { StatusTone } from '@/constants/domain'
import {
  validateConfirmPassword,
  validateContact,
  validateNickname,
  validatePassword,
} from '@/utils/validators'

/** 个人中心：资料维护、改密码、退出登录 */
const router = useRouter()
const userStore = useUserStore()

const isLoadingProfile = ref(false)
const loadError = ref('')

// ── 资料表单 ──
const profileForm = ref({ nickname: '', contact: '' })
const profileErrors = ref<Record<string, string>>({})
const profileSubmitError = ref('')
const isSavingProfile = ref(false)

// ── 改密表单 ──
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordErrors = ref<Record<string, string>>({})
const passwordSubmitError = ref('')
const isSavingPassword = ref(false)

const displayName = computed(() => userStore.displayName)
const avatarLetter = computed(() => {
  const name = userStore.displayName
  return name === '未登录' ? '·' : name.slice(0, 1).toUpperCase()
})
const roleToneValue = computed<StatusTone>(() => roleTone(userStore.role) as StatusTone)

function fillProfileForm(): void {
  profileForm.value = {
    nickname: userStore.userProfile?.nickname ?? '',
    contact: userStore.userProfile?.contact ?? '',
  }
}

async function loadProfile(): Promise<void> {
  isLoadingProfile.value = true
  loadError.value = ''
  try {
    await userStore.refreshProfile({ silent: true })
    fillProfileForm()
  } catch (error) {
    loadError.value = resolveErrorMessage(error)
  } finally {
    isLoadingProfile.value = false
  }
}

async function handleSaveProfile(): Promise<void> {
  const errors: Record<string, string> = {}
  const nicknameError = validateNickname(profileForm.value.nickname)
  if (nicknameError !== '') errors.nickname = nicknameError
  const contactError = validateContact(profileForm.value.contact)
  if (contactError !== '') errors.contact = contactError

  profileErrors.value = errors
  if (Object.keys(errors).length > 0) return

  isSavingProfile.value = true
  profileSubmitError.value = ''
  try {
    await userStore.saveProfile({
      nickname: profileForm.value.nickname.trim(),
      contact: profileForm.value.contact.trim(),
    })
    fillProfileForm()
    showSuccessToast('资料已保存')
  } catch (error) {
    profileSubmitError.value = resolveErrorMessage(error)
  } finally {
    isSavingProfile.value = false
  }
}

async function handleChangePassword(): Promise<void> {
  const errors: Record<string, string> = {}
  const oldPasswordError = validatePassword(passwordForm.value.oldPassword)
  if (oldPasswordError !== '') errors.oldPassword = oldPasswordError
  const newPasswordError = validatePassword(passwordForm.value.newPassword)
  if (newPasswordError !== '') errors.newPassword = newPasswordError
  if (
    newPasswordError === '' &&
    passwordForm.value.oldPassword !== '' &&
    passwordForm.value.newPassword === passwordForm.value.oldPassword
  ) {
    errors.newPassword = '新密码不能与旧密码相同'
  }
  const confirmError = validateConfirmPassword(
    passwordForm.value.newPassword,
    passwordForm.value.confirmPassword,
  )
  if (confirmError !== '') errors.confirmPassword = confirmError

  passwordErrors.value = errors
  if (Object.keys(errors).length > 0) return

  isSavingPassword.value = true
  passwordSubmitError.value = ''
  try {
    await userStore.savePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    })
    // 与后端约定一致：改密成功后本地凭证作废，回登录页重新登录
    showSuccessToast('密码已修改，请重新登录')
    await router.replace({
      name: 'userLogin',
      query: { username: userStore.userProfile?.username ?? '' },
    })
  } catch (error) {
    passwordSubmitError.value = resolveErrorMessage(error)
  } finally {
    isSavingPassword.value = false
  }
}

async function handleSignOut(): Promise<void> {
  const isConfirmed = await requestConfirm({
    title: '退出登录',
    message: '退出后需要重新登录才能发布与认领，是否确定退出当前账号？',
    confirmText: '退出登录',
    danger: true,
  })
  if (!isConfirmed) return

  await userStore.signOut()
  showSuccessToast('已退出登录')
  await router.push({ name: 'itemFeed', params: { type: 'lost' } })
}

onMounted(async () => {
  await loadProfile()
})

onMounted(() => {
  if (loadError.value !== '') showErrorToast(loadError.value)
})
</script>

<template>
  <div class="profile-view page-section">
    <div class="content-container">
      <header class="profile-view__header">
        <p class="eyebrow">我的</p>
        <h1 class="section-title">个人中心</h1>
      </header>

      <div class="profile-view__grid">
        <aside class="profile-summary surface-card">
          <span class="profile-summary__avatar" aria-hidden="true">{{ avatarLetter }}</span>
          <p class="profile-summary__name">{{ displayName }}</p>
          <p class="profile-summary__username">@{{ userStore.userProfile?.username ?? '—' }}</p>
          <StatusPill :label="roleLabel(userStore.role)" :tone="roleToneValue" />

          <p v-if="isLoadingProfile" class="profile-summary__hint">正在同步资料…</p>
          <p
            v-else-if="loadError !== ''"
            class="profile-summary__hint profile-summary__hint--error"
          >
            {{ loadError }}
          </p>

          <nav class="profile-summary__links">
            <RouterLink :to="{ name: 'myItems' }">我的发布</RouterLink>
            <RouterLink :to="{ name: 'myClaims' }">我的认领</RouterLink>
            <RouterLink v-if="userStore.isBackOffice" :to="{ name: 'adminReview' }"
              >发布审核</RouterLink
            >
            <RouterLink v-if="userStore.isBackOffice" :to="{ name: 'adminClaims' }"
              >认领审批</RouterLink
            >
            <RouterLink v-if="userStore.isSystemAdmin" :to="{ name: 'adminUsers' }"
              >用户管理</RouterLink
            >
          </nav>

          <button type="button" class="btn btn--danger btn--block" @click="handleSignOut">
            退出登录
          </button>
        </aside>

        <div class="profile-view__panels">
          <section class="profile-panel surface-card">
            <h2 class="block-title">基本资料</h2>
            <p class="profile-panel__note">
              用户名与角色不可修改，昵称与联系方式会展示在发布的信息中。
            </p>

            <p v-if="profileSubmitError !== ''" class="auth-notice auth-notice--error">
              {{ profileSubmitError }}
            </p>

            <form class="profile-panel__form" novalidate @submit.prevent="handleSaveProfile">
              <div class="field">
                <label class="field__label field__label-required" for="profile-nickname"
                  >昵称</label
                >
                <input
                  id="profile-nickname"
                  v-model="profileForm.nickname"
                  class="input"
                  :class="{ 'input--invalid': (profileErrors.nickname ?? '') !== '' }"
                  type="text"
                />
                <p v-if="(profileErrors.nickname ?? '') !== ''" class="field__error">
                  {{ profileErrors.nickname }}
                </p>
              </div>

              <div class="field">
                <label class="field__label field__label-required" for="profile-contact"
                  >联系方式</label
                >
                <input
                  id="profile-contact"
                  v-model="profileForm.contact"
                  class="input"
                  :class="{ 'input--invalid': (profileErrors.contact ?? '') !== '' }"
                  type="text"
                />
                <p v-if="(profileErrors.contact ?? '') !== ''" class="field__error">
                  {{ profileErrors.contact }}
                </p>
              </div>

              <div class="profile-panel__actions">
                <button type="submit" class="btn btn--primary" :disabled="isSavingProfile">
                  {{ isSavingProfile ? '保存中…' : '保存资料' }}
                </button>
              </div>
            </form>
          </section>

          <section class="profile-panel surface-card">
            <h2 class="block-title">修改密码</h2>
            <p class="profile-panel__note">修改成功后当前登录状态会失效，需要用新密码重新登录。</p>

            <p v-if="passwordSubmitError !== ''" class="auth-notice auth-notice--error">
              {{ passwordSubmitError }}
            </p>

            <form class="profile-panel__form" novalidate @submit.prevent="handleChangePassword">
              <div class="field">
                <label class="field__label field__label-required" for="profile-old-password"
                  >当前密码</label
                >
                <input
                  id="profile-old-password"
                  v-model="passwordForm.oldPassword"
                  class="input"
                  :class="{ 'input--invalid': (passwordErrors.oldPassword ?? '') !== '' }"
                  type="password"
                  autocomplete="current-password"
                />
                <p v-if="(passwordErrors.oldPassword ?? '') !== ''" class="field__error">
                  {{ passwordErrors.oldPassword }}
                </p>
              </div>

              <div class="profile-panel__row">
                <div class="field">
                  <label class="field__label field__label-required" for="profile-new-password"
                    >新密码</label
                  >
                  <input
                    id="profile-new-password"
                    v-model="passwordForm.newPassword"
                    class="input"
                    :class="{ 'input--invalid': (passwordErrors.newPassword ?? '') !== '' }"
                    type="password"
                    autocomplete="new-password"
                  />
                  <p v-if="(passwordErrors.newPassword ?? '') !== ''" class="field__error">
                    {{ passwordErrors.newPassword }}
                  </p>
                </div>

                <div class="field">
                  <label class="field__label field__label-required" for="profile-confirm-password"
                    >确认新密码</label
                  >
                  <input
                    id="profile-confirm-password"
                    v-model="passwordForm.confirmPassword"
                    class="input"
                    :class="{ 'input--invalid': (passwordErrors.confirmPassword ?? '') !== '' }"
                    type="password"
                    autocomplete="new-password"
                  />
                  <p v-if="(passwordErrors.confirmPassword ?? '') !== ''" class="field__error">
                    {{ passwordErrors.confirmPassword }}
                  </p>
                </div>
              </div>

              <div class="profile-panel__actions">
                <button type="submit" class="btn btn--primary" :disabled="isSavingPassword">
                  {{ isSavingPassword ? '提交中…' : '修改密码' }}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.profile-view__grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  align-items: start;
}

.profile-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-8) var(--space-6);
  text-align: center;
}

.profile-summary__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--ink-primary);
  color: var(--ink-inverse);
  font-size: 26px;
  font-weight: 600;
}

.profile-summary__name {
  font-size: 19px;
  font-weight: 600;
}

.profile-summary__username {
  color: var(--ink-tertiary);
  font-size: 14px;
}

.profile-summary__hint {
  color: var(--ink-tertiary);
  font-size: 13px;
}

.profile-summary__hint--error {
  color: var(--danger);
}

.profile-summary__links {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-4) 0;
  border-top: 1px solid var(--line-hairline);
  border-bottom: 1px solid var(--line-hairline);
  margin: var(--space-2) 0;
}

.profile-summary__links a {
  font-size: 14px;
}

.profile-view__panels {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.profile-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-8);
}

.profile-panel__note {
  color: var(--ink-secondary);
  font-size: 14px;
}

.profile-panel__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.profile-panel__row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.profile-panel__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .profile-view__grid {
    grid-template-columns: 1fr;
  }

  .profile-panel {
    padding: var(--space-6);
  }
}

@media (max-width: 560px) {
  .profile-panel__row {
    grid-template-columns: 1fr;
  }
}
</style>
