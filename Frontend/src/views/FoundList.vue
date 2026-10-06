<template>
    <div class="list-view">
        <SearchPanel />

        <!-- 列表区：骨架占位，物品卡片后续在此渲染 -->
        <section class="list-placeholder">
            <p class="placeholder-title">招领启事列表区域</p>
            <p class="placeholder-desc">物品卡片将在此处渲染</p>
        </section>
    </div>
</template>

<script setup lang="ts">
import SearchPanel from '../components/SearchPanel.vue';
</script>

<style scoped>
.list-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 500px;
    margin-top: 20px;
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
