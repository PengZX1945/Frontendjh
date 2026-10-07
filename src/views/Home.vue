<template>
    <DefaultLayout>
        <template #main>
            <div class="home-page">
                <!-- 首页公告横幅：仅招领/寻物列表页显示 -->
                <AnnouncementBar v-if="showAnnouncement" />
                <!-- 首页子路由切换动画：招领/寻物/详情/我的/发布等 -->
                <router-view v-slot="{ Component }">
                    <transition name="fade-slide" mode="out-in">
                        <component :is="Component" :key="$route.path" />
                    </transition>
                </router-view>
            </div>
        </template>
    </DefaultLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import AnnouncementBar from '../components/AnnouncementBar.vue';

const route = useRoute();
const showAnnouncement = computed(() => ['found', 'lost'].includes(String(route.name)));
</script>

<style scoped>
.home-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 16px 40px;
    box-sizing: border-box;
}
</style>
