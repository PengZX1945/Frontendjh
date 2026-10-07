<script setup lang="ts">
import EmptyState from '@/components/empty-state.vue'
</script>

<template>
  <div class="not-found page-section">
    <div class="content-container">
      <EmptyState title="这个页面不存在" message="地址输错了，或者内容已经被移除。">
        <RouterLink class="btn btn--primary" :to="{ name: 'itemFeed', params: { type: 'lost' } }">
          回到信息流
        </RouterLink>
      </EmptyState>
    </div>
  </div>
</template>
