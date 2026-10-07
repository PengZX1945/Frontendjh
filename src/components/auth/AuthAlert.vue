<template>
  <Transition name="auth-alert">
    <p v-if="message" class="auth-alert" :class="`is-${type}`" role="alert">
      {{ message }}
    </p>
  </Transition>
</template>

<script setup lang="ts">
/** 统一的提示条：接口报错、校验提醒、成功提示都用它 */
withDefaults(
  defineProps<{
    /** 为空时不渲染任何内容 */
    message?: string
    type?: 'error' | 'success' | 'info'
  }>(),
  {
    message: '',
    type: 'error',
  },
)
</script>

<style scoped>
.auth-alert {
  margin: 0 0 14px;
  padding: 9px 12px;
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 9px;
}

.auth-alert.is-error {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.auth-alert.is-success {
  color: #15803d;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.auth-alert.is-info {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.auth-alert-enter-active,
.auth-alert-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.auth-alert-enter-from,
.auth-alert-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
