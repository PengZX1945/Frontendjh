<script setup lang="ts">
import { ref } from 'vue'

import { uploadImage } from '@/api/upload-api'
import { uploadConstraints } from '@/constants/domain'
import { imageAcceptAttribute, validateImageFile } from '@/utils/image-upload'
import { resolveErrorMessage } from '@/utils/error-message'

/**
 * 图片上传：本地选图 → 逐张上传 → 回填 URL 列表。
 * 上传中的图片以占位块呈现，失败时给出可读原因，不阻塞已成功的图片。
 */
const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')
const uploadingCount = ref(0)

const maxImageCount = uploadConstraints.maxImageCount

function openFilePicker(): void {
  errorMessage.value = ''
  fileInput.value?.click()
}

function appendImage(imageUrl: string): void {
  if (imageUrl === '') return
  emit('update:modelValue', [...props.modelValue, imageUrl])
}

function removeImage(index: number): void {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, currentIndex) => currentIndex !== index),
  )
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  const selectedFiles = Array.from(input.files ?? [])
  input.value = ''
  if (selectedFiles.length === 0) return

  // 每次投递先清掉上一轮的错误，否则「先失败后成功」时旧提示会留在界面上，
  // 看起来像这次也失败了
  errorMessage.value = ''

  const remainingSlots = maxImageCount - props.modelValue.length
  if (remainingSlots <= 0) {
    errorMessage.value = `最多上传 ${maxImageCount} 张图片`
    return
  }

  const acceptedFiles = selectedFiles.slice(0, remainingSlots)
  if (selectedFiles.length > remainingSlots) {
    errorMessage.value = `最多上传 ${maxImageCount} 张，已自动取前 ${remainingSlots} 张`
  }

  for (const file of acceptedFiles) {
    const validationError = validateImageFile(file)
    if (validationError !== '') {
      errorMessage.value = `${file.name}：${validationError}`
      continue
    }
    uploadingCount.value += 1
    try {
      const imageUrl = await uploadImage(file, { silent: true })
      appendImage(imageUrl)
    } catch (error) {
      errorMessage.value = `${file.name}：${resolveErrorMessage(error)}`
    } finally {
      uploadingCount.value -= 1
    }
  }
}
</script>

<template>
  <div class="image-uploader">
    <ul class="image-uploader__list">
      <li
        v-for="(imageUrl, index) in modelValue"
        :key="`${imageUrl}-${index}`"
        class="image-uploader__item"
      >
        <img :src="imageUrl" :alt="`已上传图片 ${index + 1}`" loading="lazy" />
        <button
          type="button"
          class="image-uploader__remove"
          :aria-label="`移除第 ${index + 1} 张图片`"
          @click="removeImage(index)"
        >
          ×
        </button>
      </li>

      <li
        v-for="slot in uploadingCount"
        :key="`uploading-${slot}`"
        class="image-uploader__item image-uploader__item--loading"
      >
        <span class="btn__spinner" aria-hidden="true"></span>
        <span class="sr-only">正在上传</span>
      </li>

      <li
        v-if="modelValue.length + uploadingCount < maxImageCount"
        class="image-uploader__item image-uploader__add"
      >
        <button type="button" class="image-uploader__add-button" @click="openFilePicker">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              d="M12 5v14M5 12h14"
            />
          </svg>
          <span>添加图片</span>
        </button>
      </li>
    </ul>

    <input
      ref="fileInput"
      class="sr-only"
      type="file"
      multiple
      :accept="imageAcceptAttribute"
      @change="handleFileChange"
    />

    <p class="field__hint">
      最多 {{ maxImageCount }} 张，支持 jpg / png / webp，单张不超过
      5MB。图片是认领时最有力的证据，建议拍清物品特征。
    </p>
    <p v-if="errorMessage !== ''" class="field__error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.image-uploader__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.image-uploader__item {
  position: relative;
  width: 96px;
  height: 96px;
  overflow: hidden;
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
}

.image-uploader__item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-uploader__item--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-tertiary);
}

.image-uploader__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}

.image-uploader__remove:hover {
  background: rgba(0, 0, 0, 0.75);
}

.image-uploader__item--add {
  border-style: dashed;
  border-color: var(--line-strong);
  background: transparent;
}

.image-uploader__add-button {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: inherit;
  background: transparent;
  color: var(--ink-secondary);
  font-size: 12px;
  cursor: pointer;
}

.image-uploader__add-button:hover {
  background: var(--surface-sunken);
  color: var(--ink-primary);
}
</style>
