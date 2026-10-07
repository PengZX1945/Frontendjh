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
            <el-option label="全部" value="" />
            <el-option v-for="item in ITEM_CATEGORIES" :key="item" :label="item" :value="item" />
        </el-select>

        <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
            class="search-date"
        />
    </section>
</template>

<script setup lang="ts">
import { ITEM_CATEGORIES } from '../api/itemMeta';

// 搜索条件交给父页面持有，改动后由父页面重新拉列表
const keyword = defineModel<string>('keyword', { default: '' });
const category = defineModel<string>('category', { default: '' });
/** 时间区间：[开始, 结束]，清空时为 null */
const dateRange = defineModel<Array<string> | null>('dateRange', { default: null });
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
:deep(.search-date) {
    width: auto !important;
    flex: none;
    padding-left: 6px !important;
    padding-right: 6px !important;
}
:deep(.search-date .el-range-input) {
    min-width: 20px;
    flex: 1 1 0;
    padding-left: 2px !important;
    padding-right: 2px !important;
}
:deep(.search-date .el-range-input:first-of-type) {
    text-align: right !important;
}
:deep(.search-date .el-range-input:first-of-type)::placeholder {
    text-align: right !important;
}
:deep(.search-date .el-range-input:last-of-type) {
    text-align: left;
}
:deep(.search-date .el-range-input:last-of-type)::placeholder {
    text-align: left;
}
</style>
