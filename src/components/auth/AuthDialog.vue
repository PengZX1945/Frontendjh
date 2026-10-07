<template>
    <Teleport to="body">
        <div v-if="store.visible" ref="rootRef" class="auth-pop" :style="popStyle">
            <!-- 头部 -->
            <div class="pop-head">
                <div class="pop-brand">
                    <span class="pop-logo" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="7" width="18" height="13" rx="2" />
                            <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
                            <path d="M3 12h18" />
                        </svg>
                    </span>
                    <span class="pop-title">失物招领平台</span>
                </div>
                <button class="pop-close" aria-label="关闭" @click="store.closeAuth()">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
            </div>

            <div class="tabs-wrap">
                <el-tabs v-model="store.tab" stretch>
                    <!-- 登录 -->
                    <el-tab-pane label="登录" name="login">
                        <form class="form" novalidate @submit.prevent="handleLogin">
                            <AuthInput id="pop-login-user" v-model="loginForm.username" label="账号" icon="user"
                                name="username" placeholder="4-32 位字母、数字或下划线" autocomplete="username"
                                :error="loginErrors.username" @input="loginErrors.username = ''" @blur="checkLoginUsername" />
                            <AuthInput id="pop-login-pwd" v-model="loginForm.password" label="密码" icon="lock"
                                type="password" name="password" placeholder="6-64 位，不能包含特殊符号"
                                autocomplete="current-password" :error="loginErrors.password"
                                @input="loginErrors.password = ''" @blur="checkLoginPassword" />
                            <div class="row">
                                <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
                            </div>
                            <AuthAlert :message="loginMessage" :type="loginMessageType" />
                            <AuthButton :loading="loginLoading" loading-text="登录中…">登 录</AuthButton>
                            <p class="switch">
                                没有账号？<a class="link" href="#" @click.prevent="store.tab = 'register'">立即注册</a>
                            </p>
                        </form>
                    </el-tab-pane>

                    <!-- 注册 -->
                    <el-tab-pane label="注册" name="register">
                        <form class="form" novalidate @submit.prevent="handleRegister">
                            <AuthInput id="pop-reg-user" v-model="regForm.username" label="账号" icon="user" name="username"
                                placeholder="4-32 位字母、数字或下划线" autocomplete="username" :maxlength="32"
                                :error="regErrors.username" @input="regErrors.username = ''" />
                            <AuthInput id="pop-reg-pwd" v-model="regForm.password" label="密码" icon="lock" type="password"
                                name="password" placeholder="6-64 位，不能包含特殊符号" autocomplete="new-password"
                                :maxlength="64" :error="regErrors.password" @input="regErrors.password = ''" />
                            <div v-if="regForm.password" class="strength" :class="`is-level-${strength}`">
                                <span v-for="(filled, index) in strengthBars" :key="index" class="strength__bar"
                                    :class="{ 'is-on': filled }" />
                                <span class="strength__text">{{ strengthText }}</span>
                            </div>
                            <AuthInput id="pop-reg-confirm" v-model="regForm.confirm" label="确认密码" icon="lock"
                                type="password" name="confirm" placeholder="请再次输入密码" autocomplete="new-password"
                                :maxlength="64" :error="regErrors.confirm" @input="regErrors.confirm = ''" />
                            <AuthInput id="pop-reg-nickname" v-model="regForm.nickname" label="昵称" icon="user"
                                name="nickname" placeholder="你的昵称" :error="regErrors.nickname"
                                @input="regErrors.nickname = ''" />
                            <AuthInput id="pop-reg-contact" v-model="regForm.contact" label="联系方式" icon="mail"
                                name="contact" placeholder="手机号 / 邮箱 / 微信" :error="regErrors.contact"
                                @input="regErrors.contact = ''" />
                            <div class="agree-wrap">
                                <el-checkbox v-model="agreed" class="agree" @change="regErrors.agree = ''">
                                    我已阅读并同意《用户服务协议》
                                </el-checkbox>
                                <p v-if="regErrors.agree" class="agree__error">{{ regErrors.agree }}</p>
                            </div>
                            <AuthAlert :message="regMessage" :type="regMessageType" />
                            <AuthButton :loading="regLoading" loading-text="注册中…">注 册</AuthButton>
                            <p class="switch">
                                已有账号？<a class="link" href="#" @click.prevent="store.tab = 'login'">马上登录</a>
                            </p>
                        </form>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { AuthAlert, AuthButton, AuthInput } from './export';
import { login, register, getProfile } from '../../api/request';
import { ErrorCode, resolveErrorMessage } from '../../api/errorCode';
import { resolveRole } from '../../api/localAccounts';
import { useUserStore } from '../../stores/user';
import { useAuthStore } from '../../stores/ui';
import {
    validateLoginUsername,
    validatePassword,
    validateRegisterUsername,
    validateConfirm,
    passwordStrength,
    STRENGTH_TEXT,
} from '../../utils/validators';

const userStore = useUserStore();
const store = useAuthStore();

const rootRef = ref<HTMLElement | null>(null);
const popStyle = computed(() => ({
    top: `${store.pos.top}px`,
    right: `${store.pos.right}px`,
}));

/* ---------------- 登录 ---------------- */
const loginForm = reactive({ username: '', password: '', remember: true });
const loginErrors = reactive({ username: '', password: '' });
const loginLoading = ref(false);
const loginMessage = ref('');
const loginMessageType = ref<'error' | 'success' | 'info'>('error');

function checkLoginUsername(): boolean {
    loginForm.username = loginForm.username.trim();
    loginErrors.username = validateLoginUsername(loginForm.username);
    return !loginErrors.username;
}
function checkLoginPassword(): boolean {
    loginErrors.password = validatePassword(loginForm.password);
    return !loginErrors.password;
}

async function handleLogin() {
    if (loginLoading.value) return;
    loginMessage.value = '';
    if (!checkLoginUsername() || !checkLoginPassword()) return;

    loginLoading.value = true;
    try {
        const res = await login({ username: loginForm.username.trim(), password: loginForm.password });
        if (res?.code !== ErrorCode.SUCCESS) {
            loginMessageType.value = 'error';
            loginMessage.value = resolveErrorMessage(res?.code, res?.msg, '登录失败，请稍后重试');
            loginForm.password = '';
            return;
        }
        const token = res.data?.token;
        if (typeof token !== 'string' || !token) {
            loginMessageType.value = 'error';
            loginMessage.value = '登录失败，请稍后重试';
            loginForm.password = '';
            return;
        }

        userStore.setAuth({
            token,
            username: loginForm.username.trim(),
            remember: loginForm.remember,
            role: resolveRole(res.data?.role),
        });
        const profile = await getProfile();
        if (profile?.code === ErrorCode.SUCCESS && profile.data) {
            userStore.setAuth({
                token,
                username: loginForm.username.trim(),
                remember: loginForm.remember,
                role: resolveRole(profile.data.role),
                userId: profile.data.id,
            });
        }

        store.closeAuth();
        ElMessage.success('登录成功');
    } catch (err) {
        loginMessageType.value = 'error';
        loginMessage.value = err instanceof Error && err.message ? err.message : '登录失败，请稍后重试';
        loginForm.password = '';
    } finally {
        loginLoading.value = false;
    }
}

/* ---------------- 注册 ---------------- */
const regForm = reactive({ username: '', password: '', confirm: '', nickname: '', contact: '' });
const regErrors = reactive({ username: '', password: '', confirm: '', nickname: '', contact: '', agree: '' });
const agreed = ref(false);
const regLoading = ref(false);
const regMessage = ref('');
const regMessageType = ref<'error' | 'success' | 'info'>('error');

const strength = computed(() => passwordStrength(regForm.password));
const strengthText = computed(() => (regForm.password ? (STRENGTH_TEXT[strength.value] ?? '') : ''));
const strengthBars = computed(() => [1, 2, 3].map((n) => n <= strength.value));

function validateReg(): boolean {
    regForm.username = regForm.username.trim();
    regForm.nickname = regForm.nickname.trim();
    regForm.contact = regForm.contact.trim();

    regErrors.username = validateRegisterUsername(regForm.username);
    regErrors.password = validatePassword(regForm.password);
    regErrors.confirm = validateConfirm(regForm.password, regForm.confirm);
    regErrors.nickname = regForm.nickname ? '' : '请填写昵称';
    regErrors.contact = regForm.contact ? '' : '请填写联系方式';
    regErrors.agree = agreed.value ? '' : '请先阅读并同意《用户服务协议》';
    return (
        !regErrors.username &&
        !regErrors.password &&
        !regErrors.confirm &&
        !regErrors.nickname &&
        !regErrors.contact &&
        !regErrors.agree
    );
}

async function handleRegister() {
    if (regLoading.value) return;
    regMessage.value = '';
    if (!validateReg()) return;

    regLoading.value = true;
    try {
        const res = await register({
            username: regForm.username,
            password: regForm.password,
            nickname: regForm.nickname,
            contact: regForm.contact,
        });
        if (res?.code !== ErrorCode.SUCCESS) {
            regMessageType.value = 'error';
            regMessage.value = resolveErrorMessage(res?.code, res?.msg, '注册失败，该账号可能已被使用');
            return;
        }
        regMessageType.value = 'success';
        regMessage.value = '注册成功，正在前往登录…';
        setTimeout(() => {
            store.tab = 'login';
            loginForm.username = regForm.username;
            loginForm.password = '';
            loginMessageType.value = 'success';
            loginMessage.value = '注册成功，请登录';
            regMessage.value = '';
        }, 700);
    } catch (err) {
        regMessageType.value = 'error';
        regMessage.value = err instanceof Error && err.message ? err.message : '注册失败，请稍后重试';
    } finally {
        regLoading.value = false;
    }
}

/* ---------------- 关闭交互：ESC / 点击外部 ---------------- */
let docClickTimer: ReturnType<typeof setTimeout> | undefined;

function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') store.closeAuth();
}
function onDocClick(e: MouseEvent): void {
    if (rootRef.value && !rootRef.value.contains(e.target as Node)) store.closeAuth();
}
watch(
    () => store.visible,
    (v) => {
        if (v) {
            // 延迟一帧再注册 document 点击监听：避免“打开按钮”那一次 click
            // 冒泡到 document 时，把自己的监听误判为“点击外部”而立刻关闭浮层。
            docClickTimer = setTimeout(() => {
                document.addEventListener('click', onDocClick);
            }, 0);
            document.addEventListener('keydown', onKeydown);
        } else {
            clearTimeout(docClickTimer);
            docClickTimer = undefined;
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onKeydown);
        }
    },
);
onUnmounted(() => {
    clearTimeout(docClickTimer);
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.auth-pop {
    position: fixed;
    z-index: 3000;
    width: 360px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.06);
    border: 1px solid #eef1f6;
    overflow: hidden;
    animation: pop-in 0.18s ease;
    max-height: calc(100vh - 24px);
    display: flex;
    flex-direction: column;
}
@keyframes pop-in {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: none; }
}
.pop-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 4px;
}
.pop-brand {
    display: flex;
    align-items: center;
    gap: 8px;
}
.pop-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: linear-gradient(135deg, #409eff, #36b3f0);
    color: #fff;
}
.pop-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
}
.pop-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.15s;
}
.pop-close:hover {
    background: #f3f4f6;
    color: #374151;
}
.tabs-wrap {
    padding: 4px 18px 18px;
    overflow-y: auto;
}
.form {
    display: flex;
    flex-direction: column;
    gap: 13px;
    padding-top: 4px;
}
.row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: -2px;
}
.switch {
    margin: 0;
    text-align: center;
    font-size: 13px;
    color: #475569;
}
.link {
    color: #2563eb;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
}
.link:hover {
    text-decoration: underline;
}
.strength {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: -6px;
}
.strength__bar {
    flex: 1;
    height: 4px;
    border-radius: 999px;
    background: #e2e8f0;
    transition: background 0.2s;
}
.strength.is-level-1 .strength__bar.is-on { background: #ef4444; }
.strength.is-level-2 .strength__bar.is-on { background: #f59e0b; }
.strength.is-level-3 .strength__bar.is-on { background: #22c55e; }
.strength__text {
    min-width: 26px;
    font-size: 12px;
    color: #94a3b8;
    text-align: right;
}
.agree-wrap {
    margin-top: -2px;
    text-align: left;
}
.agree {
    display: flex;
    align-items: flex-start;
    height: auto;
    font-size: 13px;
    line-height: 1.6;
    color: #7a7a7a;
    white-space: normal;
}
.agree__error {
    margin: 6px 0 0;
    font-size: 12px;
    color: #dc2626;
}
:deep(.el-tabs__nav-wrap) {
    padding: 0 4px;
}
:deep(.el-tabs__item) {
    font-size: 14px;
    height: 40px;
}
</style>
