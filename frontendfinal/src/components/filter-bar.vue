<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

/**
 * 筛选条：关键词搜索（输入停顿后自动触发）+ 分类气泡。
 * 关键词与分类都通过 `update:*` 回传，父组件只负责重新取数。
 */
const props = defineProps<{
  keyword: string
  category: string
  categoryOptions: readonly string[]
  /** 顶部展示的命中数量说明，未搜索时不传 */
  hint?: string
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  'update:category': [value: string]
  search: []
}>()

const keywordDraft = ref(props.keyword)
let debounceTimer: number | undefined

watch(
  () => props.keyword,
  (nextKeyword) => {
    // 父组件重置筛选时同步输入框，避免看着旧词却筛着空条件
    if (nextKeyword !== keywordDraft.value) keywordDraft.value = nextKeyword
  },
)

function scheduleSearch(): void {
  window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    emit('update:keyword', keywordDraft.value.trim())
    emit('search')
  }, 350)
}

function handleKeywordInput(): void {
  scheduleSearch()
}

function handleKeywordSubmit(): void {
  window.clearTimeout(debounceTimer)
  emit('update:keyword', keywordDraft.value.trim())
  emit('search')
}

function clearKeyword(): void {
  keywordDraft.value = ''
  handleKeywordSubmit()
}

function selectCategory(category: string): void {
  emit('update:category', category)
  emit('search')
}

onBeforeUnmount(() => {
  window.clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="filter-bar">
    <div class="filter-bar__search">
      <svg class="filter-bar__search-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.6" />
        <path
          d="M10.6 10.6 14 14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
      <input
        v-model="keywordDraft"
        class="filter-bar__input"
        type="search"
        placeholder="搜索物品名称、描述或地点…"
        aria-label="搜索物品"
        @input="handleKeywordInput"
        @keyup.enter="handleKeywordSubmit"
      />
      <button
        v-if="keywordDraft !== ''"
        type="button"
        class="filter-bar__clear"
        aria-label="清空搜索"
        @click="clearKeyword"
      >
        清除
      </button>
    </div>

    <div class="filter-bar__categories">
      <button
        type="button"
        class="chip"
        :class="{ 'chip--active': category === '' }"
        @click="selectCategory('')"
      >
        全部
      </button>
      <button
        v-for="option in categoryOptions"
        :key="option"
        type="button"
        class="chip"
        :class="{ 'chip--active': category === option }"
        @click="selectCategory(option)"
      >
        {{ option }}
      </button>
    </div>

    <p v-if="hint" class="filter-bar__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.filter-bar__search {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-bar__search-icon {
  position: absolute;
  left: 18px;
  width: 16px;
  height: 16px;
  color: var(--ink-tertiary);
}

.filter-bar__input {
  width: 100%;
  padding: 14px 84px 14px 46px;
  border: 1px solid var(--line-hairline);
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  font-size: 16px;
  transition:
    background var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    box-shadow var(--duration-fast) var(--ease-standard);
}

.filter-bar__input::-webkit-search-cancel-button {
  display: none;
}

.filter-bar__input:focus {
  outline: none;
  border-color: var(--accent);
  background: var(--surface-canvas);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

.filter-bar__clear {
  position: absolute;
  right: 16px;
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-secondary);
  font-size: 14px;
  cursor: pointer;
}

.filter-bar__clear:hover {
  color: var(--ink-primary);
}

.filter-bar__categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.filter-bar__hint {
  color: var(--ink-tertiary);
  font-size: 13px;
}
</style>
