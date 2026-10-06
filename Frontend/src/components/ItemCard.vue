<template>
    <article class="item-card">
        <!-- 封面：有图就显示第一张，没图用图标占位 -->
        <div class="item-cover">
            <img v-if="cover" class="cover-img" :src="cover" :alt="item.item_name" />
            <svg v-else class="cover-icon" viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor"
                stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
                <path d="M3 12h18" />
            </svg>
        </div>

        <div class="item-body">
            <div class="item-head">
                <h3 class="item-title">{{ item.item_name }}</h3>
                <StatusTag :status="item.status" />
            </div>

            <p class="item-meta">
                <svg class="meta-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.4" />
                </svg>
                <span>{{ item.location }}</span>
            </p>

            <p class="item-meta">
                <svg class="meta-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4.2l2.8 1.8" />
                </svg>
                <span>{{ happenTime }}</span>
            </p>

            <p class="item-desc">{{ item.description }}</p>
        </div>
    </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatusTag from './StatusTag.vue';
import { formatItemTime, type Item } from '../api/itemMeta';

const props = defineProps<{ item: Item }>();

/** 卡片只展示第一张图 */
const cover = computed(() => props.item.images?.[0] ?? '');
const happenTime = computed(() => formatItemTime(props.item.happen_time));
</script>

<style scoped>
.item-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.item-cover {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
    margin: 12px 12px 0;
    border-radius: 6px;
    background: #e8f2fd;
    color: #409eff;
    overflow: hidden;
}

.cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.item-body {
    padding: 12px 14px 16px;
}

.item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.item-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.item-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
    font-size: 13px;
    color: #909399;
}

.meta-icon {
    flex-shrink: 0;
}

.item-desc {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: #606266;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
