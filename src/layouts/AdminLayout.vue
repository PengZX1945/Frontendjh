<template>
    <div class="admin-layout">
        <header class="admin-header">
            <div class="admin-title">失物招领 · 管理后台</div>
            <nav class="admin-nav">
                <router-link class="back-link" to="/home/found">← 返回前台</router-link>
            </nav>
        </header>
        <main class="admin-main">
            <router-view v-slot="{ Component }">
                <transition name="fade-slide" mode="out-in">
                    <component :is="Component" :key="$route.path" />
                </transition>
            </router-view>
        </main>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.admin-layout {
    min-height: 100vh;
    background: #f5f7fa;
}
.admin-header {
    display: flex;
    align-items: center;
    gap: 40px;
    height: 54px;
    padding: 0 30px;
    background: #fff;
    border-bottom: 1px solid #ebeef5;
    box-sizing: border-box;
}
.admin-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}
.admin-nav {
    display: flex;
    align-items: center;
    gap: 22px;
}
.admin-nav a {
    font-size: 14px;
    color: #606266;
    text-decoration: none;
}
.admin-nav a.is-active {
    color: #409eff;
    font-weight: 500;
}
.back-link {
    margin-left: auto;
    color: #909399 !important;
}
.admin-main {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 16px 40px;
    box-sizing: border-box;
}
</style>
