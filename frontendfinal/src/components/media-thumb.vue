<script setup lang="ts">
import { ref } from 'vue'

/**
 * 缩略图。
 * 物品图片可能缺失或加载失败（外链失效），两种情况都回落为同一块占位面，
 * 避免卡片高度随图片状态跳动。
 */
const props = withDefaults(
  defineProps<{
    src?: string
    alt: string
    /** CSS aspect-ratio，例如 '4 / 3' */
    ratio?: string
  }>(),
  { src: '', ratio: '4 / 3' },
)

const isFailed = ref(false)

function handleError(): void {
  isFailed.value = true
}
</script>

<template>
  <div class="media-thumb" :style="{ aspectRatio: ratio }">
    <img
      v-if="props.src !== '' && !isFailed"
      class="media-thumb__image"
      :src="props.src"
      :alt="props.alt"
      loading="lazy"
      decoding="async"
      @error="handleError"
    />
    <div v-else class="media-thumb__placeholder">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        aria-hidden="true"
      >
        <rect x="5" y="8" width="22" height="17" rx="3.5" />
        <circle cx="12" cy="14.5" r="2.2" />
        <path d="M5 21.5 12.5 16l5 4 3.5-2.6L27 21" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.media-thumb {
  position: relative;
  overflow: hidden;
  width: 100%;
  background: var(--surface-sunken);
}

.media-thumb__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms var(--ease-out);
}

.media-thumb__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(140deg, #f5f5f7 0%, #ececf0 60%, #e4e4ea 100%);
  color: rgba(0, 0, 0, 0.22);
}

.media-thumb__placeholder svg {
  width: 34px;
  height: 34px;
}
</style>
