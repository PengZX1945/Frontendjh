<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { toErrorMessage } from '@/utils/error-message'
import { toUserRoleLabel } from '@/utils/user-role'
import {
  contactRules,
  createConfirmPasswordRules,
  newPasswordRules,
  nicknameRules,
  oldPasswordRules,
} from '@/utils/validators'

const router = useRouter()
const userStore = useUserStore()

const roleLabel = computed(() =>
  userStore.userProfile ? toUserRoleLabel(userStore.userProfile.role) : '—',
)

// —— 基本信息修改 ——
const profileFormRef = ref<FormInstance>()
const profileForm = reactive({ nickname: '', contact: '' })
const profileFormRules: FormRules<typeof profileForm> = {
  nickname: nicknameRules,
  contact: contactRules,
}
const profileErrorMessage = ref('')
const isSavingProfile = ref(false)

// —— 修改密码 ——
const passwordDialogVisible = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const passwordFormRules: FormRules<typeof passwordForm> = {
  oldPassword: oldPasswordRules,
  newPassword: newPasswordRules,
  confirmPassword: createConfirmPasswordRules(() => passwordForm.newPassword),
}
const passwordErrorMessage = ref('')
const isChangingPassword = ref(false)
const isSigningOut = ref(false)

onMounted(() => {
  fillProfileForm()
  void refreshProfile()
})

/** 用服务端档案覆盖本地缓存，同时回填表单 */
async function refreshProfile(): Promise<void> {
  try {
    await userStore.loadProfile()
    fillProfileForm()
  } catch {
    // 提示已由请求层给出；若因凭证失效返回 401，App.vue 会统一清理登录态
  }
}

function fillProfileForm(): void {
  const profile = userStore.userProfile
  if (!profile) return
  profileForm.nickname = profile.nickname
  profileForm.contact = profile.contact
}

async function submitProfileForm(): Promise<void> {
  if (isSavingProfile.value) return

  const isFormValid = await profileFormRef.value?.validate().catch(() => false)
  if (!isFormValid) return

  isSavingProfile.value = true
  profileErrorMessage.value = ''
  try {
    await userStore.saveProfileChanges(
      { nickname: profileForm.nickname.trim(), contact: profileForm.contact.trim() },
      { silent: true },
    )
    ElMessage.success('个人信息已更新')
  } catch (submitError) {
    profileErrorMessage.value = toErrorMessage(submitError, '保存失败，请稍后重试')
  } finally {
    isSavingProfile.value = false
  }
}

function openPasswordDialog(): void {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordErrorMessage.value = ''
  passwordDialogVisible.value = true
}

async function submitPasswordForm(): Promise<void> {
  if (isChangingPassword.value) return

  const isFormValid = await passwordFormRef.value?.validate().catch(() => false)
  if (!isFormValid) return

  isChangingPassword.value = true
  passwordErrorMessage.value = ''
  // 改密成功会清空本地登录态，故先把用户名取出来供跳转使用
  const changedUsername = userStore.userProfile?.username
  try {
    await userStore.saveNewPassword(
      { oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword },
      { silent: true },
    )
    passwordDialogVisible.value = false
    ElMessage.success('密码已修改，请使用新密码重新登录')
    await router.replace({ name: 'userLogin', query: { username: changedUsername } })
  } catch (submitError) {
    passwordErrorMessage.value = toErrorMessage(submitError, '修改失败，请稍后重试')
  } finally {
    isChangingPassword.value = false
  }
}

async function signOut(): Promise<void> {
  if (isSigningOut.value) return

  try {
    await ElMessageBox.confirm(
      '退出后需重新登录才能发布失物信息或提交认领申请。',
      '确认退出登录？',
      {
        confirmButtonText: '退出登录',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    // 用户取消，不做任何处理
    return
  }

  isSigningOut.value = true
  const signedOutUsername = userStore.userProfile?.username
  try {
    await userStore.signOut()
    ElMessage.success('已退出登录')
  } finally {
    isSigningOut.value = false
    await router.replace({ name: 'userLogin', query: { username: signedOutUsername } })
  }
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-header">
      <div class="profile-header-inner">
        <div class="profile-header-text">
          <h1 class="profile-header-title">个人中心</h1>
          <p class="profile-header-subtitle">你好，{{ userStore.displayName }}</p>
        </div>
        <el-button :loading="isSigningOut" @click="signOut">退出登录</el-button>
      </div>
    </header>

    <main class="profile-body">
      <el-card shadow="never" class="profile-card">
        <template #header>
          <span class="profile-card-title">账号信息</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户 ID">
            {{ userStore.userProfile?.userId ?? '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户名">
            {{ userStore.userProfile?.username || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="昵称">
            {{ userStore.userProfile?.nickname || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag type="success" disable-transitions>{{ roleLabel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系方式" :span="2">
            {{ userStore.userProfile?.contact || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="profile-card">
        <template #header>
          <span class="profile-card-title">修改个人信息</span>
        </template>
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileFormRules"
          label-width="88px"
          @submit.prevent="submitProfileForm"
        >
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="profileForm.nickname" placeholder="展示用的名字" clearable />
          </el-form-item>
          <el-form-item label="联系方式" prop="contact">
            <el-input
              v-model="profileForm.contact"
              placeholder="手机号 / 邮箱 / QQ 号 / 微信号"
              clearable
            />
          </el-form-item>

          <el-alert
            v-if="profileErrorMessage"
            :title="profileErrorMessage"
            type="error"
            :closable="false"
            show-icon
            class="profile-form-alert"
          />

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="isSavingProfile">
              保存修改
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card shadow="never" class="profile-card">
        <template #header>
          <span class="profile-card-title">账号安全</span>
        </template>
        <div class="profile-security-row">
          <div class="profile-security-text">
            <p class="profile-security-label">登录密码</p>
            <p class="profile-security-hint">修改成功后需要重新登录</p>
          </div>
          <el-button @click="openPasswordDialog">修改密码</el-button>
        </div>
      </el-card>
    </main>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="440px">
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordFormRules"
        label-width="88px"
        @submit.prevent="submitPasswordForm"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            autocomplete="current-password"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="6 ~ 32 位，需包含字母与数字"
            autocomplete="new-password"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            autocomplete="new-password"
            show-password
            @keyup.enter="submitPasswordForm"
          />
        </el-form-item>

        <el-alert
          v-if="passwordErrorMessage"
          :title="passwordErrorMessage"
          type="error"
          :closable="false"
          show-icon
        />
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isChangingPassword" @click="submitPasswordForm">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100%;
}

.profile-header {
  background: #ffffff;
  border-bottom: 1px solid #e6eaf0;
}

.profile-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 880px;
  margin: 0 auto;
  padding: 20px 24px;
}

.profile-header-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2d3d;
}

.profile-header-subtitle {
  margin: 0;
  font-size: 13px;
  color: #7b8794;
}

.profile-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 880px;
  margin: 0 auto;
  padding: 24px;
}

.profile-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2d3d;
}

.profile-form-alert {
  margin-bottom: 16px;
}

.profile-security-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.profile-security-label {
  margin: 0 0 4px;
  font-size: 14px;
  color: #1f2d3d;
}

.profile-security-hint {
  margin: 0;
  font-size: 12px;
  color: #7b8794;
}
</style>
