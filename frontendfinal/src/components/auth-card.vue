<script setup lang="ts">
/** 登录 / 注册页共用的版式：居中卡片 + 品牌标识 */
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <div class="auth-page">
    <div class="auth-page__inner">
      <RouterLink class="auth-page__brand" :to="{ name: 'itemFeed', params: { type: 'lost' } }">
        <span class="auth-page__mark" aria-hidden="true">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
          >
            <path
              d="M12.6 21.4a4.6 4.6 0 0 1-1.3-3.2c0-1.2.5-2.3 1.3-3.2l3.4-3.4a4.5 4.5 0 0 1 6.4 0"
            />
            <path
              d="M19.4 10.6a4.6 4.6 0 0 1 1.3 3.2c0 1.2-.5 2.3-1.3 3.2l-3.4 3.4a4.5 4.5 0 0 1-6.4 0"
            />
          </svg>
        </span>
        校园失物招领
      </RouterLink>

      <div class="auth-page__card">
        <h1 class="auth-page__title">{{ title }}</h1>
        <p class="auth-page__subtitle">{{ subtitle }}</p>
        <slot />
      </div>

      <div class="auth-page__aside">
        <slot name="aside" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: var(--space-16) var(--layout-gutter) var(--space-20);
  background: var(--surface-sunken);
  min-height: calc(100vh - var(--layout-header-height));
}

.auth-page__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: 440px;
}

.auth-page__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  align-self: center;
  color: var(--ink-primary);
  font-weight: 600;
  letter-spacing: -0.015em;
}

.auth-page__brand:hover {
  text-decoration: none;
}

.auth-page__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--accent);
  color: #fff;
}

.auth-page__mark svg {
  width: 19px;
  height: 19px;
}

.auth-page__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  background: var(--surface-canvas);
  box-shadow: var(--shadow-card);
}

.auth-page__title {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.auth-page__subtitle {
  margin-top: calc(var(--space-5) * -1 + var(--space-1));
  color: var(--ink-secondary);
  font-size: 15px;
}

.auth-page__aside {
  color: var(--ink-secondary);
  font-size: 14px;
  text-align: center;
}

@media (max-width: 640px) {
  .auth-page {
    padding: var(--space-10) var(--layout-gutter) var(--space-16);
  }

  .auth-page__card {
    padding: var(--space-6);
  }
}
</style>
