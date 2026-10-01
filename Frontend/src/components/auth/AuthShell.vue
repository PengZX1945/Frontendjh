<template>
  <div class="auth-shell">
    <div class="auth-card">
      <header class="auth-head">
        <h1 class="auth-title">{{ title }}</h1>
        <p v-if="subtitle" class="auth-subtitle">{{ subtitle }}</p>
        <slot name="subtitle" />
      </header>

      <slot />

      <p v-if="tip" class="auth-tip">{{ tip }}</p>
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录 / 注册页共用的外壳：渐变背景 + 居中卡片。
 * 页面只需要关心卡片内部的表单内容。
 */
withDefaults(
  defineProps<{
    /** 卡片主标题 */
    title: string
    /** 标题下方的说明文字 */
    subtitle?: string
    /** 卡片底部的版权等小字 */
    tip?: string
  }>(),
  {
    subtitle: '',
    tip: '',
  },
)
</script>

<style scoped>
.auth-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  overflow: auto;
  background: linear-gradient(60deg, #132f7c 0%, #538eed 65%, #73e8cc 100%);
}

/* 背景上的一层柔光，避免大块渐变显得单调 */
.auth-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.25), transparent 55%);
  pointer-events: none;
}

.auth-card {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--auth-card-width, 380px);
  padding: 34px 32px 28px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);
  text-align: center;
  animation: auth-card-in 0.35s ease-out;
}

.auth-card:hover {
  box-shadow: 0 22px 55px rgba(15, 23, 42, 0.32);
}

.auth-head {
  margin-bottom: 22px;
}

.auth-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1f2328;
}

.auth-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: #7a7a7a;
}

.auth-tip {
  margin: 18px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

@keyframes auth-card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .auth-shell {
    padding: 16px;
  }

  .auth-card {
    padding: 26px 20px 22px;
  }

  .auth-title {
    font-size: 22px;
  }
}
</style>
