<template>
  <AuthShell title="校园失物招领系统" tip="© Powered by 大作业第 6 组">
    <p class="subtitle">请使用 <u><b>账号</b></u> 和 <u><b>密码</b></u> 登录</p>

    <form class="form" novalidate @submit.prevent="handleLogin">
      <AuthInput
        id="login-username"
        v-model="form.username"
        label="账号"
        icon="user"
        name="username"
        placeholder="4-32 位字母、数字或下划线"
        autocomplete="username"
        :error="errors.username"
        @input="clearFieldError('username')"
        @blur="checkUsername"
      />

      <AuthInput
        id="login-password"
        v-model="form.password"
        label="密码"
        icon="lock"
        type="password"
        name="password"
        placeholder="8-64 位，不能包含特殊符号"
        autocomplete="current-password"
        :error="errors.password"
        @input="clearFieldError('password')"
        @blur="checkPassword"
      />

      <div class="row">
        <el-checkbox v-model="form.remember">记住我</el-checkbox>
        <a
          class="link"
          href="https://www.baidu.com/?tn=68018901_16_pg"
          target="_blank"
          rel="noopener"
        >
          忘记密码？
        </a>
      </div>

      <AuthAlert :message="message" type="error" />

      <AuthButton :loading="loading" loading-text="登录中…">登 录</AuthButton>
    </form>

    <!-- 本地调试账号：切到真实后端（USE_LOCAL_LOGIN = false）后自动隐藏 -->
    <div v-if="USE_LOCAL_LOGIN" class="local-accounts">
      <p class="local-accounts__title">本地调试账号</p>
      <p v-for="account in LOCAL_ACCOUNTS" :key="account.username" class="local-accounts__item">
        <b>{{ account.username }}</b> / {{ account.password }}
        <span class="local-accounts__role">{{ ROLE_LABEL[account.role] }}</span>
      </p>
    </div>

    <p class="switch">
      没有账号？<RouterLink class="link" to="/register">立即注册</RouterLink>
    </p>
  </AuthShell>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AuthAlert, AuthButton, AuthInput, AuthShell } from '@/components/auth/export';
import { login } from '../api/request';
import { ErrorCode, resolveErrorMessage } from '@/api/errorCode';
import { LOCAL_ACCOUNTS, ROLE_LABEL, localLogin, resolveRole } from '@/api/localAccounts';
import { useUserStore } from '@/stores/user';
import { validateLoginUsername, validatePassword } from '@/utils/validators';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

/** 后端 /api 还没接入时走本地账号（见 api/localAccounts.ts）；联调时改成 false 即请求真实接口 */
const USE_LOCAL_LOGIN = true;

const form = reactive({
    username: '',
    password: '',
    remember: true
});

const loading = ref(false);
const message = ref('');
const errors = reactive({ username: '', password: '' });

/** 失焦时即时提示，提交前再统一校验一次 */
function checkUsername(): boolean {
    form.username = form.username.trim();
    errors.username = validateLoginUsername(form.username);
    return !errors.username;
}
function checkPassword(): boolean {
    errors.password = validatePassword(form.password);
    return !errors.password;
}

/** 提交前校验整个表单，不通过就不发请求 */
function validate(): boolean {
    const usernameValid = checkUsername();
    const passwordValid = checkPassword();
    return usernameValid && passwordValid;
}

/** 用户开始修改字段时清掉报错，避免旧提示一直挂着 */
function clearFieldError(field: 'username' | 'password'): void {
    errors[field] = '';
    message.value = '';
}

// 进页面时回填账号：优先用注册页带过来的，其次是「记住我」留下的
onMounted(() => {
    const fromQuery = route.query.username;

    form.username =
        typeof fromQuery === 'string' && fromQuery ? fromQuery : userStore.getRememberedUsername();
});

// 登录先做格式校验（避免明显不合法的账号 / 密码发到后端），账号密码是否正确仍由后端判断
async function handleLogin() {
    if (loading.value) return;
    message.value = '';
    if (!validate()) return;

    loading.value = true;
    try {
        const username = form.username.trim();
        const res = USE_LOCAL_LOGIN
            ? await localLogin({ username, password: form.password })
            : await login({ username, password: form.password });

        // 后端约定：code === 0 表示登录成功，其余错误码统一走错误码表（api/errorCode.ts）
        if (res?.code !== ErrorCode.SUCCESS) {
            message.value = resolveErrorMessage(res?.code, res?.msg, '登录失败，请稍后重试');
            form.password = '';
            return;
        }

        const token = res.data?.token;
        if (typeof token !== 'string' || !token) {
            message.value = '登录失败，请稍后重试';
            form.password = '';
            return;
        }

        // 写入 store：内部会按「记住我」把登录态持久化到 localStorage / sessionStorage
        userStore.setAuth({
            token,
            username,
            remember: form.remember,
            role: resolveRole(res.data?.role),
            nickname: typeof res.data?.nickname === 'string' ? res.data.nickname : '',
            contact: typeof res.data?.contact === 'string' ? res.data.contact : '',
        });

        // 跳回被守卫拦截前的页面；没有 redirect 就进首页
        const redirect = route.query.redirect;
        router.push(typeof redirect === 'string' && redirect ? redirect : '/home');
    } catch (err) {
        message.value =
            err instanceof Error && err.message ? err.message : '登录失败，请稍后重试';
        form.password = '';
    } finally {
        loading.value = false;
    }
}
</script>


<style scoped>
.subtitle {
    margin: 0 0 18px;
    font-size: 13px;
    color: #666;
}

.subtitle b {
    color: #2563eb;
}

.row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    font-size: 13px;
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

.switch {
    margin: 16px 0 0;
    font-size: 13px;
    color: #475569;
}

/* 本地调试账号提示，只在前端自测时出现 */
.local-accounts {
    margin-top: 16px;
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.7;
    color: #64748b;
    text-align: left;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
}

.local-accounts__title {
    margin: 0;
    font-weight: 600;
    color: #475569;
}

.local-accounts__item {
    margin: 0;
}

.local-accounts__role {
    margin-left: 6px;
    padding: 0 6px;
    font-size: 11px;
    color: #2563eb;
    background: #eff6ff;
    border-radius: 4px;
}
</style>
