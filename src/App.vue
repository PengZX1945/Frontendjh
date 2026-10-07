<template>
    <!-- 顶层路由出口：带切换动画 -->
    <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="$route.path" />
        </transition>
    </router-view>
    <!-- 登录 / 注册二级弹窗：全局挂载，NavBar 等处触发 -->
    <AuthDialog />
</template>

<script setup lang="ts">
import AuthDialog from './components/auth/AuthDialog.vue';
</script>

<!-- 页面切换动画（全局，Home / Admin 等所有路由出口共用） -->
<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(12px);
}
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
