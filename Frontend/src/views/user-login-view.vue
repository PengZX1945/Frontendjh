<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { toErrorMessage } from '@/utils/error-message'
import { loginPasswordRules, usernameRules } from '@/utils/validators'

interface LoginFormModel {
  username: string
  password: string
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loginForm = reactive<LoginFormModel>({
  // 从注册页跳转过来时带上刚注册的用户名，省去重复输入
  username: typeof route.query.username === 'string' ? route.query.username : '',
  password: '',
})
const loginFormRules: FormRules<LoginFormModel> = {
  username: usernameRules,
  password: loginPasswordRules,
}

const submitErrorMessage = ref('')
const isSubmitting = ref(false)

async function submitLoginForm(): Promise<void> {
  if (isSubmitting.value) return

  const isFormValid = await loginFormRef.value?.validate().catch(() => false)
  if (!isFormValid) return

  isSubmitting.value = true
  submitErrorMessage.value = ''
  try {
    // silent：错误提示由卡片内的 el-alert 呈现，避免与全局提示重复
    await userStore.signIn(
      { username: loginForm.username.trim(), password: loginForm.password },
      { silent: true },
    )
    ElMessage.success('登录成功')
    await router.replace(readRedirectPath())
  } catch (submitError) {
    submitErrorMessage.value = toErrorMessage(submitError, '登录失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

/** 只接受站内相对路径，避免被 query 参数带到外部地址 */
function readRedirectPath(): string {
  const redirectPath = route.query.redirect
  return typeof redirectPath === 'string' && redirectPath.startsWith('/')
    ? redirectPath
    : '/profile'
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <header class="auth-card-header">
        <h1 class="auth-card-title">校园失物招领系统</h1>
        <p class="auth-card-subtitle">登录后即可发布失物信息、提交认领申请</p>
      </header>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginFormRules"
        label-position="top"
        size="large"
        @submit.prevent="submitLoginForm"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            autocomplete="username"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            show-password
            @keyup.enter="submitLoginForm"
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
          登录
        </el-button>
      </el-form>

      <footer class="auth-card-footer">
        <span class="auth-card-footer-text">还没有账号？</span>
        <el-link type="primary" @click="router.push({ name: 'userRegister' })">立即注册</el-link>
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
  max-width: 420px;
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
