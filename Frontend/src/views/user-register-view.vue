<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { toErrorMessage } from '@/utils/error-message'
import {
  contactRules,
  createConfirmPasswordRules,
  nicknameRules,
  registerPasswordRules,
  usernameRules,
} from '@/utils/validators'

interface RegisterFormModel {
  username: string
  nickname: string
  contact: string
  password: string
  confirmPassword: string
}

const router = useRouter()
const userStore = useUserStore()

const registerFormRef = ref<FormInstance>()
const registerForm = reactive<RegisterFormModel>({
  username: '',
  nickname: '',
  contact: '',
  password: '',
  confirmPassword: '',
})
const registerFormRules: FormRules<RegisterFormModel> = {
  username: usernameRules,
  nickname: nicknameRules,
  contact: contactRules,
  password: registerPasswordRules,
  confirmPassword: createConfirmPasswordRules(() => registerForm.password),
}

const submitErrorMessage = ref('')
const isSubmitting = ref(false)

async function submitRegisterForm(): Promise<void> {
  if (isSubmitting.value) return

  const isFormValid = await registerFormRef.value?.validate().catch(() => false)
  if (!isFormValid) return

  isSubmitting.value = true
  submitErrorMessage.value = ''
  try {
    await userStore.signUp(
      {
        username: registerForm.username.trim(),
        password: registerForm.password,
        nickname: registerForm.nickname.trim(),
        contact: registerForm.contact.trim(),
      },
      { silent: true },
    )
    ElMessage.success('注册成功，请使用新账号登录')
    // 带上用户名跳转，登录页会自动回填
    await router.replace({ name: 'userLogin', query: { username: registerForm.username.trim() } })
  } catch (submitError) {
    submitErrorMessage.value = toErrorMessage(submitError, '注册失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <header class="auth-card-header">
        <h1 class="auth-card-title">注册新账号</h1>
        <p class="auth-card-subtitle">昵称与联系方式将展示在失物信息中，便于失主与你联系</p>
      </header>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerFormRules"
        label-position="top"
        size="large"
        @submit.prevent="submitRegisterForm"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="3 ~ 20 位字母、数字或下划线"
            autocomplete="username"
            clearable
          />
        </el-form-item>

        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="registerForm.nickname" placeholder="展示用的名字" clearable />
        </el-form-item>

        <el-form-item label="联系方式" prop="contact">
          <el-input
            v-model="registerForm.contact"
            placeholder="手机号 / 邮箱 / QQ 号 / 微信号"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="6 ~ 32 位，需包含字母与数字"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            autocomplete="new-password"
            show-password
            @keyup.enter="submitRegisterForm"
          />
        </el-form-item>

        <el-alert
          v-if="submitErrorMessage"
          :title="submitErrorMessage"
          type="error"
          :closable="false"
          show-icon
          class="auth-card-alert"
        />

        <el-button
          type="primary"
          size="large"
          native-type="submit"
          :loading="isSubmitting"
          class="auth-card-submit"
        >
          注册
        </el-button>
      </el-form>

      <footer class="auth-card-footer">
        <span class="auth-card-footer-text">已有账号？</span>
        <el-link type="primary" @click="router.push({ name: 'userLogin' })">返回登录</el-link>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 460px;
  padding: 36px 32px 28px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(31, 45, 61, 0.12);
}

.auth-card-header {
  margin-bottom: 24px;
  text-align: center;
}

.auth-card-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2d3d;
}

.auth-card-subtitle {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #7b8794;
}

.auth-card-alert {
  margin-bottom: 16px;
}

.auth-card-submit {
  width: 100%;
}

.auth-card-footer {
  margin-top: 20px;
  font-size: 13px;
  text-align: center;
  color: #7b8794;
}

.auth-card-footer-text {
  margin-right: 4px;
}
</style>
