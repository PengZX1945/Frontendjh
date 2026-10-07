<template>
    <div class="admin-page">
        <el-tabs v-model="activeType" @tab-change="onTabChange">
            <el-tab-pane label="招领待审" name="found" />
            <el-tab-pane label="寻物待审" name="lost" />
            <el-tab-pane label="认领处理" name="claims">
                <AdminClaims v-if="activeType === 'claims'" />
            </el-tab-pane>
        </el-tabs>

        <div class="admin-filter" v-if="activeType !== 'claims'">
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                clearable
                class="admin-date"
                @change="load"
            />
        </div>

        <el-table :data="items" v-loading="loading" border>
            <el-table-column label="图片" width="96">
                <template #default="{ row }">
                    <el-image
                        v-if="row.images?.[0]"
                        :src="row.images[0]"
                        fit="cover"
                        style="width: 64px; height: 64px; border-radius: 4px; display: block"
                    />
                    <span v-else style="color: #c0c4cc">无图</span>
                </template>
            </el-table-column>
            <el-table-column prop="item_name" label="名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="location" label="地点" min-width="130" show-overflow-tooltip />
            <el-table-column prop="happen_time" label="发生时间" min-width="150" />
            <el-table-column prop="contact" label="联系方式" min-width="120" />
            <el-table-column prop="id" label="发布者ID" width="90" />
            <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="success" @click="approve(row)">通过</el-button>
                    <el-button size="small" type="danger" @click="reject(row)">驳回</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!loading && items.length === 0" description="暂无待审核内容" />
    </div>
</template>

<script setup lang    ="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchPendingItems, reviewItem } from '../../api/admin.ts';
import type { Item, ItemType } from '../../api/itemMeta.ts';
import AdminClaims from './AdminClaims.vue';

const activeType = ref<ItemType | 'claims'>('found');
const dateRange = ref<Array<string> | null>(null);
const items = ref<Item[]>([]);
const loading = ref(false);

/** 认领处理 tab 交由 AdminClaims 自身加载；其余 tab 加载待审物品 */
function onTabChange() {
    if (activeType.value !== 'claims') load();
}

async function load() {
    loading.value = true;
    try {
        const res = await fetchPendingItems(
            activeType.value as ItemType,
            dateRange.value?.[0],
            dateRange.value?.[1],
        );
        if (res?.code === 0) items.value = res.data ?? [];
        else ElMessage.error(res?.msg || '加载失败');
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '加载失败');
    } finally {
        loading.value = false;
    }
}

async function approve(row: Item) {
    const res = await reviewItem(row.id, 'approve');
    if (res?.code === 0) {
        ElMessage.success('已通过审核');
        load();
    } else {
        ElMessage.error(res?.msg || '操作失败');
    }
}

async function reject(row: Item) {
    try {
        const { value } = await ElMessageBox.prompt('请输入驳回理由', '驳回', {
            inputType: 'textarea',
            inputPlaceholder: '驳回理由将展示给发布者',
            inputValidator: (v: string) => (v && v.trim() ? true : '驳回理由不能为空'),
        });
        const res = await reviewItem(row.id, 'reject', (value || '').trim());
        if (res?.code === 0) {
            ElMessage.success('已驳回');
            load();
        } else {
            ElMessage.error(res?.msg || '操作失败');
        }
    } catch {
        /* 用户取消输入 */
    }
}

onMounted(load);
</script>

<style scoped>
.admin-filter {
    margin-bottom: 12px;
}
:deep(.admin-date) {
    width: auto !important;
    flex: none;
    padding-left: 6px !important;
    padding-right: 6px !important;
}
:deep(.admin-date .el-range-input) {
    min-width: 20px;
    flex: 1 1 0;
    padding-left: 2px !important;
    padding-right: 2px !important;
}
:deep(.admin-date .el-range-input:first-of-type) {
    text-align: right !important;
}
:deep(.admin-date .el-range-input:first-of-type)::placeholder {
    text-align: right !important;
}
:deep(.admin-date .el-range-input:last-of-type) {
    text-align: left;
}
:deep(.admin-date .el-range-input:last-of-type)::placeholder {
    text-align: left;
}

.admin-page {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
</style>
