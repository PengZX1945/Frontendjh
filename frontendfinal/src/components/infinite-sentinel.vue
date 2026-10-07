<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * 无限滚动哨兵。
 *
 * 摆在列表末尾，进入视口时通知父级加载下一页。
 * 关键细节：`disabled`（正在加载 / 已到末页）期间不触发；加载结束且哨兵仍在视口内时
 * 因为不会再有 intersection 变化，需要主动补一次判断，否则滚动会卡住。
 */
const props = defineProps<{
  /** 正在加载或已到末页时置 true */
  disabled?: boolean
}>()

const emit = defineEmits<{ reach: [] }>()

const sentinelElement = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | undefined
let isIntersecting = false

function notifyIfNeeded(): void {
  if (isIntersecting && props.disabled !== true) emit('reach')
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isIntersecting = entry.isIntersecting
        notifyIfNeeded()
      }
    },
    // 提前 500px 开始加载，滚动到底部时内容已经就位
    { rootMargin: '500px 0px' },
  )
  if (sentinelElement.value) observer.observe(sentinelElement.value)
})

watch(
  () => props.disabled,
  () => notifyIfNeeded(),
)

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div ref="sentinelElement" class="infinite-sentinel" aria-hidden="true"></div>
</template>

<style scoped>
.infinite-sentinel {
  height: 1px;
  width: 100%;
}
</style>
