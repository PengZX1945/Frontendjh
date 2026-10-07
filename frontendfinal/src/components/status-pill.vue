<script setup lang="ts">
import type { StatusTone } from '@/constants/domain'

/** 统一的状态标签：中文名由调用方按 constants/domain 的映射传入 */
defineProps<{
  label: string
  tone?: StatusTone
}>()
</script>

<template>
  <span class="status-pill" :class="`status-pill--${tone ?? 'neutral'}`">{{ label }}</span>
</template>
