<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthCard from '@/components/auth-card.vue'
import { useUserStore } from '@/stores/user'
import { showSuccessToast } from '@/composables/use-toast'
import { resolveErrorMessage } from '@/utils/error-message'
import {
  validateConfirmPassword,
  validateContact,
  validateNickname,
  validatePassword,
  validateUsername,
} from '@/utils/validators'

/** 注册页：前端先做一遍校验，后端 409（用户名已存在）在卡片内提示 */
const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const nickname = ref('')
const contact = ref('')
const password = ref('')
const confirmPassword = ref('')

const fieldErrors = ref<Record<string, string>>({})
const submitError = ref('')
const isSubmitting = ref(false)

async function handleSubmit(): Promise<void> {
  const errors: Record<string, string> = {}
  const usernameError = validateUsername(username.value)
  if (usernameError !== '') errors.username = usernameError
  const nicknameError = validateNickname(nickname.value)
  if (nicknameError !== '') errors.nickname = nicknameError
  const contactError = validateContact(contact.value)
  if (contactError !== '') errors.contact = contactError
  const passwordError = validatePassword(password.value)
  if (passwordError !== '') errors.password = passwordError
  const confirmError = validateConfirmPassword(password.value, confirmPassword.value)
  if (confirmError !== '') errors.confirmPassword = confirmError

  fieldErrors.value = errors
  if (Object.keys(errors).length > 0) return

  isSubmitting.value = true
  submitError.value = ''
  try {
    await userStore.signUp({
      username: username.value.trim(),
      password: password.value,
      nickname: nickname.value.trim(),
      contact: contact.value.trim(),
    })
    showSuccessToast('注册成功，请登录')
    await router.replace({
      name: 'userLogin',
      query: { username: username.value.trim(), registered: '1' },
    })
  } catch (error) {
    submitError.value = resolveErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthCard title="注册" subtitle="创建账号后即可发布寻物启事与失物招领">
    <p v-if="submitError !== ''" class="auth-notice auth-notice--error">{{ submitError }}</p>

    <form class="auth-form" novalidate @submit.prevent="handleSubmit">
      <div class="field">
        <label class="field__label field__label-required" for="register-username">用户名</label>
        <input
          id="register-username"
          v-model="username"
          class="input"
          :class="{ 'input--invalid': (fieldErrors.username ?? '') !== '' }"
          type="text"
          autocomplete="username"
          placeholder="字母、数字或下划线，登录时使用"
        />
        <p v-if="(fieldErrors.username ?? '') !== ''" class="field__error">
          {{ fieldErrors.username }}
        </p>
      </div>

      <div class="field">
        <label class="field__label field__label-required" for="register-nickname">昵称</label>
        <input
          id="register-nickname"
          v-model="nickname"
          class="input"
          :class="{ 'input--invalid': (fieldErrors.nickname ?? '') !== '' }"
          type="text"
          placeholder="在网页公开的名字"
        />
        <p v-if="(fieldErrors.nickname ?? '') !== ''" class="field__error">
          {{ fieldErrors.nickname }}
        </p>
      </div>

      <div class="field">
        <label class="field__label field__label-required" for="register-contact">联系方式</label>
        <input
          id="register-contact"
          v-model="contact"
          class="input"
          :class="{ 'input--invalid': (fieldErrors.contact ?? '') !== '' }"
          type="text"
          placeholder="手机号 / 邮箱，认领时的联系方式"
        />
        <p v-if="(fieldErrors.contact ?? '') !== ''" class="field__error">
          {{ fieldErrors.contact }}
        </p>
      </div>

      <div class="auth-form__row">
        <div class="field">
          <label class="field__label field__label-required" for="register-password">密码</label>
          <input
            id="register-password"
            v-model="password"
            class="input"
            :class="{ 'input--invalid': (fieldErrors.password ?? '') !== '' }"
            type="password"
            autocomplete="new-password"
            placeholder="至少 6 位"
          />
          <p v-if="(fieldErrors.password ?? '') !== ''" class="field__error">
            {{ fieldErrors.password }}
          </p>
        </div>

        <div class="field">
          <label class="field__label field__label-required" for="register-confirm">确认密码</label>
          <input
            id="register-confirm"
            v-model="confirmPassword"
            class="input"
            :class="{ 'input--invalid': (fieldErrors.confirmPassword ?? '') !== '' }"
            type="password"
            autocomplete="new-password"
            placeholder="再次输入密码"
          />
          <p v-if="(fieldErrors.confirmPassword ?? '') !== ''" class="field__error">
            {{ fieldErrors.confirmPassword }}
          </p>
        </div>
      </div>

      <button type="submit" class="btn btn--primary btn--large btn--block" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="btn__spinner" aria-hidden="true"></span>
        {{ isSubmitting ? '注册中…' : '创建账号' }}
      </button>
    </form>

    <template #aside>
      已经有账号了？
      <RouterLink :to="{ name: 'userLogin' }">直接登录</RouterLink>
    </template>
  </AuthCard>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.auth-form__row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.auth-form .btn {
  margin-top: var(--space-2);
}

@media (max-width: 520px) {
  .auth-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
