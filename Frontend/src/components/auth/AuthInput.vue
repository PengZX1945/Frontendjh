<template>
  <div class="field" :class="{ 'is-error': !!error, 'has-icon': !!icon }">
    <label class="field__label" :for="id">{{ label }}</label>

    <div class="field__control">
      <span v-if="icon" class="field__icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <template v-if="icon === 'user'">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </template>
          <template v-else-if="icon === 'lock'">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </template>
          <template v-else-if="icon === 'mail'">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 6-10 7L2 6" />
          </template>
          <template v-else-if="icon === 'nickname'">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10.5" r="2" />
            <path d="M6 16.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5" />
            <path d="M15 10h3.5" />
            <path d="M15 14h3.5" />
          </template>
          <template v-else-if="icon === 'contact'">
            <path d="M20.5 11.5a6.5 6.5 0 0 1-9.8 5.7L5 19l1.2-4.2A6.5 6.5 0 1 1 20.5 11.5Z" />
            <path d="M9 11h6" />
            <path d="M9 14h3.5" />
          </template>
        </svg>
      </span>

      <input
        :id="id"
        v-model="model"
        class="field__input"
        :class="{ 'has-toggle': isPassword }"
        :type="inputType"
        :name="name || id"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        @input="emit('input')"
        @blur="emit('blur')"
      />

      <button
        v-if="isPassword"
        class="field__toggle"
        type="button"
        :aria-label="revealed ? '隐藏密码' : '显示密码'"
        :title="revealed ? '隐藏密码' : '显示密码'"
        @click="revealed = !revealed"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <template v-if="revealed">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </template>
          <template v-else>
            <path d="M3 3l18 18" />
            <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.4 3.4" />
            <path d="M6.5 6.7A17.4 17.4 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4.2-.9" />
          </template>
        </svg>
      </button>
    </div>
    <!-- 报错↓ -->
    <p v-if="error" :id="`${id}-error`" class="field__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/** 支持 v-model 的双向绑定 */
const model = defineModel<string>({ default: '' })

/** 把输入 / 失焦事件透出去，页面可以据此做即时校验（输入时清错、失焦时校验） */
const emit = defineEmits<{
  (e: 'input'): void
  (e: 'blur'): void
}>()

const props = withDefaults(
  defineProps<{
    /** 必填：同时作为 label 的 for 和 input 的 id */
    id: string
    /** 字段名 */
    label: string
    type?: string
    name?: string
    placeholder?: string
    autocomplete?: string
    /** 左侧图标，password 类型会自动出现「显示 / 隐藏密码」按钮 */
    icon?: 'user' | 'lock' | 'mail' | 'nickname' | 'contact'
    /** 校验错误信息，有值时输入框变红并在下方展示 */
    error?: string
    maxlength?: number
  }>(),
  {
    type: 'text',
    name: '',
    placeholder: '',
    autocomplete: 'off',
    error: '',
  },
)

const revealed = ref(false)

const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && revealed.value ? 'text' : props.type))
</script>

<style scoped>
.field {
  margin-bottom: 16px;
  text-align: left;
}

.field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
}

.field__icon {
  position: absolute;
  left: 12px;
  display: flex;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.15s;
}

.field__icon svg {
  width: 18px;
  height: 18px;
}

.field__input {
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  font-size: 14px;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.has-icon .field__input {
  padding-left: 38px;
}

.field__input.has-toggle {
  padding-right: 42px;
}

.field__input::placeholder {
  color: #a9b4c4;
}

.field__input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.field__input:focus + .field__toggle,
.field__control:focus-within .field__icon {
  color: #3b82f6;
}

.field.is-error .field__input {
  border-color: #ef4444;
  background: #fff8f8;
}

.field.is-error .field__input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
}

.field.is-error .field__icon {
  color: #ef4444;
}

.field__toggle {
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.field__toggle:hover {
  color: #2563eb;
  background: #eff6ff;
}

.field__toggle svg {
  width: 18px;
  height: 18px;
}

.field__error {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #dc2626;
}
</style>
