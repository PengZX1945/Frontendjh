<template>
  <AuthShell
    title="欢迎注册"
    subtitle="加入校园失物招领系统，快速发布与认领失物"
    tip="© Powered by 大作业第 6 组"
  >
    <p class="switch">
      已有账号？<RouterLink class="link" to="/login">马上登录</RouterLink>
    </p>

    <form class="form" novalidate @submit.prevent="onSubmit">
      <AuthInput
        id="register-username"
        v-model="form.username"
        label="账号"
        icon="user"
        name="username"
        placeholder="4-16 位字母、数字或下划线"
        autocomplete="username"
        :maxlength="16"
        :error="errors.username"
      />

      <AuthInput
        id="register-password"
        v-model="form.password"
        label="密码"
        icon="lock"
        type="password"
        name="password"
        placeholder="6-20 位，不能包含特殊符号"
        autocomplete="new-password"
        :maxlength="20"
        :error="errors.password"
      />

      <!-- 密码强度实时提示 -->
      <div v-if="form.password" class="strength" :class="`is-level-${strength}`">
        <span
          v-for="(filled, index) in strengthBars"
          :key="index"
          class="strength__bar"
          :class="{ 'is-on': filled }"
        />
        <span class="strength__text">{{ strengthText }}</span>
      </div>

      <AuthInput
        id="register-confirm"
        v-model="form.confirm"
        label="确认密码"
        icon="lock"
        type="password"
        name="confirm"
        placeholder="请再次输入密码"
        autocomplete="new-password"
        :maxlength="20"
        :error="errors.confirm"
      />

      <div class="agree-wrap">
        <label class="agree">
          <input v-model="agreed" type="checkbox" class="agree__box" @change="errors.agree = ''" />
          <span>我已阅读并同意 <a class="link" href="#">《用户服务协议》</a></span>
        </label>
        <p v-if="errors.agree" class="agree__error">{{ errors.agree }}</p>
      </div>

      <AuthAlert :message="message" :type="messageType" />

      <AuthButton :loading="loading" loading-text="注册中…">注 册</AuthButton>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthAlert, AuthButton, AuthInput, AuthShell } from '@/components/auth'
import { register } from '../api/request'
import {
  STRENGTH_TEXT,
  passwordStrength,
  validateConfirm,
  validatePassword,
  validateRegisterUsername,
} from '@/utils/validators'

/** 后端 /api 还没接入时先用本地模拟，联调时改成 false 即可走真实接口 */
const USE_MOCK = false
const MOCK_DELAY = 600

const router = useRouter()

const form = reactive({ username: '', password: '', confirm: '' })
const errors = reactive({ username: '', password: '', confirm: '', agree: '' })
const agreed = ref(false)
const loading = ref(false)
const message = ref('')
const messageType = ref<'error' | 'success' | 'info'>('error')

// 密码强度：0 太短 / 1 弱 / 2 中 / 3 强
const strength = computed(() => passwordStrength(form.password))
const strengthText = computed(() => (form.password ? (STRENGTH_TEXT[strength.value] ?? '') : ''))
const strengthBars = computed(() => [1, 2, 3].map((n) => n <= strength.value))

/** 校验整个表单，返回是否通过 */
function validate(): boolean {
  form.username = form.username.trim()

  errors.username = validateRegisterUsername(form.username)
  errors.password = validatePassword(form.password)
  errors.confirm = validateConfirm(form.password, form.confirm)
  errors.agree = agreed.value ? '' : '请先阅读并同意《用户服务协议》'

  return !errors.username && !errors.password && !errors.confirm && !errors.agree
}

async function onSubmit() {
  if (loading.value) return

  message.value = ''
  if (!validate()) return

  loading.value = true
  try {
    if (USE_MOCK) {
      // 模拟网络请求
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
    } else {
      const res = await register({ username: form.username, password: form.password })

      // 后端约定：code === 0 表示注册成功
      if (res?.code !== 0) {
        messageType.value = 'error'
        message.value = res?.msg || '注册失败，该账号可能已被使用'
        return
      }
    }

    messageType.value = 'success'
    message.value = '注册成功，正在前往登录…'

    // 注册成功后跳转登录页，并把账号带过去自动填充
    setTimeout(() => {
      router.push({ name: 'login', query: { username: form.username } })
    }, 900)
  } catch (err) {
    messageType.value = 'error'
    message.value = err instanceof Error && err.message ? err.message : '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 只保留注册页独有的样式，外壳 / 输入框 / 按钮样式见 components/auth */

.switch {
  margin: 0 0 20px;
  font-size: 13px;
  color: #475569;
}

.link {
  color: #2563eb;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* 密码强度条 */
.strength {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -8px 0 16px;
}

.strength__bar {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: #e2e8f0;
  transition: background 0.2s;
}

.strength.is-level-1 .strength__bar.is-on {
  background: #ef4444;
}

.strength.is-level-2 .strength__bar.is-on {
  background: #f59e0b;
}

.strength.is-level-3 .strength__bar.is-on {
  background: #22c55e;
}

.strength__text {
  min-width: 26px;
  font-size: 12px;
  color: #94a3b8;
  text-align: right;
}

.agree-wrap {
  margin-bottom: 14px;
  text-align: left;
}

.agree {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #7a7a7a;
  cursor: pointer;
  user-select: none;
}

.agree__box {
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: #2563eb;
  cursor: pointer;
  flex: none;
}

.agree__error {
  margin: 6px 0 0;
  font-size: 12px;
  color: #dc2626;
}
</style>
