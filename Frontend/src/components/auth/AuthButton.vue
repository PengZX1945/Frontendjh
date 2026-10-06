<template>
  <button
    class="auth-btn"
    :type="nativeType"
    :disabled="loading || disabled"
    :aria-busy="loading"
  >
    <span v-if="loading" class="auth-btn__spinner" aria-hidden="true" />
    <slot v-if="!loading" />
    <template v-else>{{ loadingText }}</template>
  </button>
</template>

<script setup lang="ts">
/**
 * 认证页主按钮：统一渐变底色、hover 抬升、loading 转圈。
 */
withDefaults(
  defineProps<{
    /** 加载中：禁用按钮并显示 loadingText */
    loading?: boolean
    loadingText?: string
    disabled?: boolean
    /** 默认 submit，方便直接放进 <form> */
    nativeType?: 'button' | 'submit' | 'reset'
  }>(),
  {
    loading: false,
    loadingText: '处理中…',
    disabled: false,
    nativeType: 'submit',
  },
)
</script>

<style scoped>
.auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 46px;
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 3px;
  color: #fff;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.2s,
    opacity 0.2s;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.35);
}

.auth-btn:active:not(:disabled) {
  transform: translateY(0);
}

.auth-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.auth-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-btn__spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: auth-btn-spin 0.7s linear infinite;
}

@keyframes auth-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
