<template>
    <el-tag :type="tagType" size="small" effect="light">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ITEM_STATUS_LABEL, ItemStatus } from '../api/itemMeta';

const props = defineProps<{ status: number }>();

const label = computed(() => ITEM_STATUS_LABEL[props.status] ?? '未知状态');

/** 状态 → 标签颜色：已认领用成功色，待审核用警示色 */
const tagType = computed(() => {
    switch (props.status) {
        case ItemStatus.PENDING:
            return 'warning';
        case ItemStatus.PUBLISHED:
            return 'primary';
        case ItemStatus.REJECTED:
            return 'danger';
        case ItemStatus.CLAIMED:
            return 'success';
        default:
            return 'info';
    }
});
</script>
