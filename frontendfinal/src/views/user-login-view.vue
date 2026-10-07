<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthCard from '@/components/auth-card.vue'
import { useUserStore } from '@/stores/user'
import { resolveErrorMessage } from '@/utils/error-message'
import { validatePassword, validateUsername } from '@/utils/validators'

/** 登录页：卡片内联错误提示，成功后回跳 `redirect` 指定的原地址 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const username = ref(typeof route.query.username === 'string' ? route.query.username : '')
const password = ref('')
const fieldErrors = ref<Record<string, string>>({})
const submitError = ref('')
const isSubmitting = ref(false)

const redirectPath = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '',
)

/** 顶部提示：register 成功跳转过来时显示 */
const noticeMessage = computed(() => (route.query.registered === '1' ? '注册成功!' : ''))

async function handleSubmit(): Promise<void> {
  const errors: Record<string, string> = {}
  const usernameError = validateUsername(username.value)
  if (usernameError !== '') errors.username = usernameError
  const passwordError = validatePassword(password.value)
  if (passwordError !== '') errors.password = passwordError

  fieldErrors.value = errors
  if (Object.keys(errors).length > 0) return

  isSubmitting.value = true
  submitError.value = ''
  try {
    await userStore.signIn({ username: username.value.trim(), password: password.value })
    await router.replace(redirectPath.value !== '' ? redirectPath.value : { name: 'userProfile' })
  } catch (error) {
    submitError.value = resolveErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard title="登录" subtitle="登录后即可发布信息、提交认领申请，并跟踪审核进度。">
    <p v-if="noticeMessage !== ''" class="auth-notice auth-notice--success">{{ noticeMessage }}</p>
    <p v-if="submitError !== ''" class="auth-notice auth-notice--error">{{ submitError }}</p>

    <form class="auth-form" novalidate @submit.prevent="handleSubmit">
      <div class="field">
        <label class="field__label field__label-required" for="login-username">用户名</label>
        <input
          id="login-username"
          v-model="username"
          class="input"
          :class="{ 'input--invalid': (fieldErrors.username ?? '') !== '' }"
          type="text"
          autocomplete="username"
          placeholder="请输入用户名"
        />
        <p v-if="(fieldErrors.username ?? '') !== ''" class="field__error">
          {{ fieldErrors.username }}
        </p>
      </div>

      <div class="field">
        <label class="field__label field__label-required" for="login-password">密码</label>
        <input
          id="login-password"
          v-model="password"
          class="input"
          :class="{ 'input--invalid': (fieldErrors.password ?? '') !== '' }"
          type="password"
          autocomplete="current-password"
          placeholder="请输入密码"
        />
        <p v-if="(fieldErrors.password ?? '') !== ''" class="field__error">
          {{ fieldErrors.password }}
        </p>
      </div>

      <button type="submit" class="btn btn--primary btn--large btn--block" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="btn__spinner" aria-hidden="true"></span>
        {{ isSubmitting ? '登录中…' : '登录' }}
      </button>
    </form>

    <template #aside>
      还没有账号？
      <RouterLink :to="{ name: 'userRegister' }">立即注册</RouterLink>
    </template>
  </AuthCard>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.auth-form .btn {
  margin-top: var(--space-2);
}
</style>
