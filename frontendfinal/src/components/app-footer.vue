<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="content-container app-footer__inner">
      <div>
        <p class="app-footer__title">校园失物招领系统</p>
        <p class="app-footer__note">精弘大作业 · 前端由 Vue 3 + TypeScript 构建</p>
      </div>
      <div class="app-footer__meta">
        <RouterLink to="/announcements">公告</RouterLink>
        <span aria-hidden="true">·</span>
        <RouterLink to="/publish">发布信息</RouterLink>
        <span aria-hidden="true">·</span>
        <span>© {{ currentYear }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: var(--space-20);
  padding: var(--space-10) 0 var(--space-12);
  border-top: 1px solid var(--line-hairline);
  background: var(--surface-sunken);
  color: var(--ink-secondary);
  font-size: 13px;
}

.app-footer__inner {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  align-items: center;
  justify-content: space-between;
}

.app-footer__title {
  font-weight: 600;
  color: var(--ink-primary);
}

.app-footer__note {
  margin-top: 2px;
}

.app-footer__meta {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.app-footer__meta a {
  color: var(--ink-secondary);
}

.app-footer__meta a:hover {
  color: var(--ink-primary);
}
</style>
