<template>
    <section class="search-panel">
        <el-input v-model="keyword" class="search-keyword" placeholder="搜索关键词" clearable>
            <template #prefix>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                </svg>
            </template>
        </el-input>

        <el-select v-model="category" class="search-category" placeholder="全部">
            <el-option v-for="item in categories" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const keyword = ref('');
const category = ref('');

/** 分类筛选项，先给静态骨架数据 */
const categories = [
    { label: '全部', value: '' },
    { label: '卡证', value: 'card' },
    { label: '数码电子', value: 'electronic' },
    { label: '挂饰饰品', value: 'accessory' },
    { label: '箱包', value: 'bag' },
    { label: '衣物', value: 'clothing' },
    { label: '钥匙', value: 'key' },
    { label: '现金钱包', value: 'wallet' },
    { label: '书籍文具', value: 'book' },
    { label: '其他', value: 'other' }
];
</script>

<style scoped>
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
</style>
