<script setup lang="ts">
import { reactive } from 'vue'

import ImageUploader from '@/components/image-uploader.vue'
import { formLimits, itemCategoryOptions, itemTypeMeta } from '@/constants/domain'
import { validateItemForm } from '@/utils/validators'
import type { ItemFormDraft, ItemType } from '@/types/item'

/**
 * 发布与编辑共用的表单。
 * 只负责「收集 + 校验 + 回传」，提交动作交给页面，避免同一套字段写两遍。
 */
const props = defineProps<{
  type: ItemType
  /** 编辑态下类型不可改（接口也没有提供改类型的语义） */
  typeLocked?: boolean
  isSubmitting: boolean
  submitLabel: string
  serverError?: string
}>()

const draft = defineModel<ItemFormDraft>({ required: true })

const emit = defineEmits<{
  submit: []
  'update:type': [value: ItemType]
}>()

const fieldErrors = reactive<Record<string, string>>({})

const typeMeta = itemTypeMeta
const typeOptions: ItemType[] = ['lost', 'found']

/** 选中项的字段名 → 展示用的标签，供模板统一渲染错误文案 */
function fieldError(name: string): string {
  return fieldErrors[name] ?? ''
}

function clearErrors(): void {
  for (const key of Object.keys(fieldErrors)) delete fieldErrors[key]
}

function handleSubmit(): void {
  clearErrors()
  const errors = validateItemForm(draft.value)
  if (Object.keys(errors).length > 0) {
    Object.assign(fieldErrors, errors)
    return
  }
  emit('submit')
}
</script>

<template>
  <form class="item-form" novalidate @submit.prevent="handleSubmit">
    <fieldset class="item-form__type">
      <legend class="field__label">发布类型</legend>
      <div class="item-form__type-options">
        <button
          v-for="option in typeOptions"
          :key="option"
          type="button"
          class="item-form__type-option"
          :class="{ 'item-form__type-option--active': option === props.type }"
          :disabled="props.typeLocked === true || props.isSubmitting"
          @click="emit('update:type', option)"
        >
          <span class="item-form__type-name">{{ typeMeta[option].label }}</span>
          <span class="item-form__type-desc">{{ typeMeta[option].description }}</span>
        </button>
      </div>
      <p v-if="props.typeLocked === true" class="field__hint">
        发布后不可更改类型，如需更换请删除后重新发布。
      </p>
    </fieldset>

    <div class="field">
      <label class="field__label field__label-required" for="item-name">物品名称</label>
      <input
        id="item-name"
        v-model="draft.itemName"
        class="input"
        :class="{ 'input--invalid': fieldError('itemName') !== '' }"
        type="text"
        :maxlength="formLimits.itemNameMaxLength"
        :placeholder="props.type === 'lost' ? '例如：黑色雨伞' : '例如：学生卡（张同学）'"
      />
      <p v-if="fieldError('itemName') !== ''" class="field__error">{{ fieldError('itemName') }}</p>
    </div>

    <div class="field">
      <label class="field__label field__label-required" for="item-category">物品分类</label>
      <select
        id="item-category"
        v-model="draft.category"
        class="select"
        :class="{ 'select--invalid': fieldError('category') !== '' }"
      >
        <option value="" disabled>请选择分类</option>
        <option v-for="option in itemCategoryOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
      <p v-if="fieldError('category') !== ''" class="field__error">{{ fieldError('category') }}</p>
    </div>

    <div class="item-form__row">
      <div class="field">
        <label class="field__label" for="item-location">
          {{ props.type === 'lost' ? '遗失地点' : '发现地点' }}
        </label>
        <input
          id="item-location"
          v-model="draft.location"
          class="input"
          :class="{ 'input--invalid': fieldError('location') !== '' }"
          type="text"
          :maxlength="formLimits.locationMaxLength"
          placeholder="例如：三号教学楼 2 层自习室"
        />
        <p v-if="fieldError('location') !== ''" class="field__error">
          {{ fieldError('location') }}
        </p>
      </div>

      <div class="field">
        <label class="field__label" for="item-happen-time">
          {{ props.type === 'lost' ? '遗失时间' : '发现时间' }}
        </label>
        <input
          id="item-happen-time"
          v-model="draft.happenTime"
          class="input"
          type="datetime-local"
        />
      </div>
    </div>

    <div class="field">
      <label class="field__label" for="item-description">详细描述</label>
      <textarea
        id="item-description"
        v-model="draft.description"
        class="textarea"
        :class="{ 'textarea--invalid': fieldError('description') !== '' }"
        :maxlength="formLimits.descriptionMaxLength"
        rows="5"
        placeholder="补充颜色、品牌、磨损、内含物等可辨识特征。信息越具体，越容易核对上。"
      ></textarea>
      <div class="item-form__counter">
        <span v-if="fieldError('description') !== ''" class="field__error">{{
          fieldError('description')
        }}</span>
        <span class="field__hint"
          >{{ draft.description.length }} / {{ formLimits.descriptionMaxLength }}</span
        >
      </div>
    </div>

    <div class="field">
      <span class="field__label">物品图片</span>
      <ImageUploader v-model="draft.images" />
    </div>

    <div class="item-form__row">
      <div class="field">
        <label class="field__label field__label-required" for="item-get-location">领取地点</label>
        <input
          id="item-get-location"
          v-model="draft.getLocation"
          class="input"
          :class="{ 'input--invalid': fieldError('getLocation') !== '' }"
          type="text"
          :maxlength="formLimits.locationMaxLength"
          placeholder="例如：图书馆一层服务台"
        />
        <p v-if="fieldError('getLocation') !== ''" class="field__error">
          {{ fieldError('getLocation') }}
        </p>
      </div>

      <div class="field">
        <label class="field__label field__label-required" for="item-get-contact"
          >领取联系方式</label
        >
        <input
          id="item-get-contact"
          v-model="draft.getContact"
          class="input"
          :class="{ 'input--invalid': fieldError('getContact') !== '' }"
          type="text"
          :maxlength="formLimits.contactMaxLength"
          placeholder="手机号 / 邮箱 / 微信号"
        />
        <p v-if="fieldError('getContact') !== ''" class="field__error">
          {{ fieldError('getContact') }}
        </p>
      </div>
    </div>

    <p v-if="props.serverError" class="item-form__server-error">{{ props.serverError }}</p>

    <div class="item-form__actions">
      <slot name="actions" />
      <button type="submit" class="btn btn--primary btn--large" :disabled="props.isSubmitting">
        <span v-if="props.isSubmitting" class="btn__spinner" aria-hidden="true"></span>
        {{ props.isSubmitting ? '提交中…' : props.submitLabel }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.item-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.item-form__type {
  padding: 0;
  border: none;
  margin: 0;
}

.item-form__type-options {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: var(--space-2);
}

.item-form__type-option {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-4);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface-canvas);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--ease-standard),
    background var(--duration-fast) var(--ease-standard);
}

.item-form__type-option:hover:not(:disabled) {
  border-color: var(--ink-tertiary);
}

.item-form__type-option--active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.item-form__type-option:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.item-form__type-name {
  font-size: 15px;
  font-weight: 600;
}

.item-form__type-desc {
  color: var(--ink-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.item-form__row {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.item-form__counter {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.item-form__server-error {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 14px;
}

.item-form__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-2);
}

@media (max-width: 640px) {
  .item-form__type-options,
  .item-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
