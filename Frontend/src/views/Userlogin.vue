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
        placeholder="请输入账号"
        autocomplete="username"
      />

      <AuthInput
        id="login-password"
        v-model="form.password"
        label="密码"
        icon="lock"
        type="password"
        name="password"
        placeholder="请输入密码"
        autocomplete="current-password"
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

const route = useRoute();
const router = useRouter();

const emit = defineEmits<{
    (e: 'login-success', username: string): void;
}>();

const form = reactive({
    username: '',
    password: '',
    remember: true
});

const loading = ref(false);
const message = ref('');

// 进页面时回填账号：优先用注册页带过来的，其次是「记住我」留下的
onMounted(() => {
    const fromQuery = route.query.username;
    const remembered = localStorage.getItem('login_user');

    if (typeof fromQuery === 'string' && fromQuery) {
        form.username = fromQuery;
    } else if (remembered) {
        form.username = remembered;
    }
});

// 登录不做前端校验，账号 / 密码是否正确交给后端判断
async function handleLogin() {
    if (loading.value) return;
    message.value = '';

    loading.value = true;
    try {
        const res = await login({
            username: form.username.trim(),
            password: form.password,
        });

        // 后端约定：code === 0 表示登录成功，其余错误码统一走错误码表（api/errorCode.ts）
        if (res?.code !== ErrorCode.SUCCESS) {
            message.value = resolveErrorMessage(res?.code, res?.msg, '登录失败，请稍后重试');
            form.password = '';
            return;
        }

        // 保存 token，供请求拦截器自动携带
        if (res?.data?.token) localStorage.setItem('token', res.data.token);

        if (form.remember) {
            localStorage.setItem('login_user', form.username);
        } else {
            localStorage.removeItem('login_user');
        }
        // 通知父组件（如果父组件监听了该事件）
        emit('login-success', form.username);

        // 跳回被守卫拦截前的页面；没有 redirect 就进首页
        const redirect = route.query.redirect;
        router.push(typeof redirect === 'string' ? redirect : '/home');
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
/* 只保留登录页独有的样式，外壳 / 输入框 / 按钮样式见 components/auth */

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
</style>
