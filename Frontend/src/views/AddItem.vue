<template>
    <div class="publish-page">
        <h2 class="page-title">发布信息</h2>

        <!-- 发布表单骨架：字段仅占位，提交逻辑待实现 -->
        <section class="publish-card">
            <div v-for="field in fields" :key="field" class="field-row">
                <span class="field-label">{{ field }}</span>
                <div class="field-control" />
            </div>

            <div class="publish-actions">
                <el-button type="primary">提交</el-button>
                <el-button>重置</el-button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
/** 表单字段占位，仅用于撑出发布页骨架 */
const fields = ['信息类型', '物品名称', '物品分类', '拾获/丢失地点', '时间', '详细描述', '物品图片'];
</script>

<style scoped>
.page-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}

.publish-card {
    padding: 24px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.field-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
}

.field-label {
    flex-shrink: 0;
    width: 110px;
    font-size: 14px;
    color: #606266;
}

.field-control {
    flex: 1;
    height: 32px;
    background: #fafafa;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
}

.publish-actions {
    margin-top: 24px;
    padding-left: 126px;
}
</style>
