<template>
    <div class="login-page">
        <form class="login-bar" 
            @submit.prevent="handleLogin"
            @keyup.enter="handleLogin"
        >
            <h1 class="title">校园失物招领系统</h1>
            <p class="subtitle">请使用 <u><b>账号</b></u> 和 <u><b>密码</b></u> 登录</p>

            <!-- 账号 -->
            <div class="field">
                <label for="username">账号</label>
                <input
                    id="username"
                    v-model.trim="data.username"
                    type="text"
                    placeholder="请输入账号:"
                    autocomplete="username"
                    @input="errorMsg = ''"
                />
            </div>

            <!-- 密码 -->
            <div class="field">
                <label for="password">密码</label>
                <div class="password-wrap">
                    <input
                        id="password"
                        v-model="data.password"
                        type="password"
                        placeholder="请输入密码:"
                        autocomplete="current-password"
                        @input="errorMsg = ''"
                    />
                </div>
            </div>

            <div class="row">
                <label class="remember">
                    <input v-model="data.remember" type="checkbox" />
                    <span>记住我</span>
                </label>
                <a class="link" href="https://www.baidu.com/?tn=68018901_16_pg" target="_blank">忘记密码？</a>
            </div>

            <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

            <button class="submit" type="submit" :disabled="loading">
                {{ loading ? '登录中…' : '登 录' }}
            </button>
            <p class="tip">© Powered by 大作业第6组</p>
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { login } from './api/user.js';

const emit = defineEmits<{
    (e: 'login-success', username: string): void;
}>();

const psw_remember = ref('on'); // 记住我选项，默认选中

/** 模拟后端的账号数据，接入真实接口时删除 */
// const MOCK_USER = { username: 'admin', password: '123456' };

const data = reactive({
    username: '',
    password: '',
    remember: true,
});

const loading = ref(false);
const errorMsg = ref('');

//校验表单，返回错误信息，通过则返回空字符串
function validate(): string {
    if (!data.username) return '请输入账号';
    if (!data.password) return '请输入密码';
    if (data.password.length < 6) return '密码长度不能少于 6 位';
    // else if ("!@#$%^&*()" in data.password) return '密码不能包含特殊字符';
    return '';
}

async function handleLogin() {
    errorMsg.value = validate();
    if (errorMsg.value) return;

    loading.value = true;
    try {
        const res = await login({
            username: data.username,
            password: data.password,
        });

        // 后端约定：code === 0 或 msg === 'success' 表示登录成功
        if (res?.code !== 0 && res?.msg !== 'success') {
            errorMsg.value = res?.msg || '账号或密码错误，请重新输入';
            data.password = '';
            return;
        }

        // 保存 token，供请求拦截器自动携带
        if (res?.data?.token) localStorage.setItem('token', res.data.token);

        if (data.remember) {
            localStorage.setItem('login_user', data.username);
        } else {
            localStorage.removeItem('login_user');
        }

        // 登录成功后的跳转由父组件通过 @login-success 决定
        emit('login-success', data.username);
    } catch (err) {
        errorMsg.value =
            err instanceof Error && err.message ? err.message : '账号或密码错误，请重新输入';
        data.password = '';
    } finally {
        loading.value = false;
    }
}
</script>


<style scoped>
.login-page {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    /* 渐变颜色 */
    background: linear-gradient(60deg, #132f7c 0%, #538eed 65%, #73e8cc 100%);
}

/* 登录bar */
.login-bar {
    position: relative;
    z-index: 1;
    /* border-box:加上边框和padding总共为350px */
    box-sizing: border-box;
    width: 350px;
    height: 500px;
    min-width: 250px;
    min-height: 400px;
    padding: 36px;
    border: 1px solid gray;
    border-radius: 17px;
    background: #fff;
    box-shadow: 10px 20px 50px rgba(0,0,0,0.2);
    backdrop-filter: blur(10px);
    text-align: center;
}

.login-bar:hover{
    box-shadow: 10px 20px 50px rgba(0,0,0,0.35);
}

.title{
    margin: 0px;
    font-size: 30px;
    color: black;
}

.subtitle {
    margin: 6px 0 24px;
    font-size: 13px;
    color: #666;
}

.field {
    margin-bottom: 16px;
}

.field label {
    display: block;
    margin-bottom: 6px;
    font-size: 15px;
    font-weight: 600;
    color: #333;
}

.field input {
    box-sizing: border-box;
    width: 100%;
    height: 42px;
    padding: 0 12px;
    font-size: 14px;
    color: #0f172a;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    background: #fff;
    outline: none;
    transition: border-color 0.1s, box-shadow 0.15s;
}

.field input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}


.password-wrap {
    position: relative;
}

.password-wrap input {
    width:100%;
}

.row {
    display: flex;
    align-items: center;
    justify-content:space-between;
    margin-bottom: 16px;
    font-size: 13px;
}

.remember {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #475569;
    cursor: pointer;
}

.link {
    color: #2563eb;
    text-decoration: none;
}

.link:hover {
    text-decoration: underline;
}

.error {
    margin: 0 0 12px;
    padding: 8px 10px;
    font-size: 13px;
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
}

.submit {
    width: 100%;
    height: 44px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 2px;
    color: #fff;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #2563eb, #06b6d4);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
}

.submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.35);
}

.submit:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.tip {
    margin: 16px 0 0;
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
}
</style>
