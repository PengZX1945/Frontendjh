<template>
    <DefaultLayout>
        <template #main>
            <div class="home-page">
                <!-- 筛选区：关键词 + 分类 -->
                <section class="search-panel">
                    <el-input v-model="keyword" class="search-keyword" placeholder="搜索关键词" clearable>
                        <template #prefix>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round">
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-3.5-3.5" />
                            </svg>
                        </template>
                    </el-input>

                    <el-select v-model="category" class="search-category" placeholder="全部">
                        <el-option v-for="item in categories" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </section>

                <!-- 列表区：骨架占位，物品卡片后续在此渲染 -->
                <section class="list-panel">
                    <div class="list-placeholder">
                        <p class="placeholder-title">物品列表区域</p>
                        <p class="placeholder-desc">物品卡片将在此处渲染</p>
                    </div>
                </section>
            </div>
        </template>
    </DefaultLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';

const keyword = ref('');
const category = ref('');

/** 分类筛选项，先给静态骨架数据 */
const categories = [
    { label: '全部', value: '' },
    { label: '证件卡片', value: 'card' },
    { label: '电子产品', value: 'electronic' },
    { label: '生活用品', value: 'daily' },
    { label: '其他', value: 'other' }
];
</script>

<style scoped>
.home-page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 16px 40px;
    box-sizing: border-box;
}

.search-panel {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.search-keyword {
    width: 240px;
}

.search-category {
    width: 140px;
}

.list-panel {
    margin-top: 20px;
}

.list-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 320px;
    background: #fff;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    color: #909399;
}

.placeholder-title {
    margin: 0;
    font-size: 15px;
    color: #606266;
}

.placeholder-desc {
    margin: 0;
    font-size: 13px;
}
</style>
