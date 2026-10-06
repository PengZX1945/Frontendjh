<template>
    <section class="search-panel">
        <el-input v-model="keyword" class="search-keyword" placeholder="搜索关键词" clearable>
            <template #prefix>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <circle cx="12" cy="12" r="7" />
                    <path d="m20 20-3.5-3.5" />
                </svg>
            </template>
        </el-input>

        <el-select v-model="category" class="search-category" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="item in ITEM_CATEGORIES" :key="item" :label="item" :value="item" />
        </el-select>
    </section>
</template>

<script setup lang="ts">
import { ITEM_CATEGORIES } from '../api/itemMeta';

// 搜索条件交给父页面持有，改动后由父页面重新拉列表
const keyword = defineModel<string>('keyword', { default: '' });
const category = defineModel<string>('category', { default: '' });
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
