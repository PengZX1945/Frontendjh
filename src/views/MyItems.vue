<template>
    <div class="my-items-page">
        <div class="toolbar">
            <el-radio-group v-model="typeFilter" @change="handleTypeChange">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button value="found">招领</el-radio-button>
                <el-radio-button value="lost">寻物</el-radio-button>
                <el-radio-button value="claims">认领申请</el-radio-button>
            </el-radio-group>
            <template v-if="typeFilter !== 'claims'">
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    clearable
                    class="my-date"
                    @change="load"
                />
                <el-button type="primary" @click="goPublish">发布新物品</el-button>
            </template>
        </div>

        <!-- 认领申请：原界面内嵌显示，不跳转新页面 -->
        <MyClaims v-if="typeFilter === 'claims'" />

        <template v-else>
            <el-table :data="items" v-loading="loading" border>
                <el-table-column label="图片" width="90">
                    <template #default="{ row }">
                        <el-image
                            v-if="row.images?.[0]"
                            :src="row.images[0]"
                            fit="cover"
                            style="width: 52px; height: 52px; border-radius: 4px; display: block"
                        />
                        <span v-else style="color: #c0c4cc">无图</span>
                    </template>
                </el-table-column>
                <el-table-column prop="item_name" label="名称" min-width="150" show-overflow-tooltip />
                <el-table-column label="类型" width="80">
                    <template #default="{ row }">{{ row.type === 'found' ? '招领' : '寻物' }}</template>
                </el-table-column>
                <el-table-column label="状态" width="100">
                    <template #default="{ row }"><StatusTag :status="row.status" /></template>
                </el-table-column>
                <el-table-column prop="happen_time" label="发生时间" min-width="150" />
                <el-table-column prop="location" label="地点" min-width="130" show-overflow-tooltip />
                <el-table-column label="操作" width="170" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" @click="view(row)">查看</el-button>
                        <el-button
                            v-if="row.status === ItemStatus.PUBLISHED"
                            size="small"
                            type="warning"
                            @click="closeOne(row)"
                        >关闭</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <el-empty v-if="!loading && items.length === 0" description="还没有发布记录" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import StatusTag from '../components/StatusTag.vue';
import MyClaims from './MyClaims.vue';
import { fetchMyItems, closeItem } from '../api/items';
import { ItemStatus, type Item } from '../api/itemMeta';

const router = useRouter();
const typeFilter = ref('');
const dateRange = ref<Array<string> | null>(null);
const items = ref<Item[]>([]);
const loading = ref(false);

async function load() {
    loading.value = true;
    try {
        const res = await fetchMyItems({
            type: typeFilter.value || undefined,
            start_time: dateRange.value?.[0],
            end_time: dateRange.value?.[1],
        });
        if (res?.code === 0) items.value = res.data ?? [];
        else ElMessage.error(res?.msg || '加载失败');
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '加载失败');
    } finally {
        loading.value = false;
    }
}

/** 顶部 tab：认领申请在原有界面内嵌显示；其余三个为类型筛选 */
function handleTypeChange(v: string | number | boolean): void {
    if (v === 'claims') {
        typeFilter.value = 'claims';
    } else {
        load();
    }
}

function view(row: Item) {
    router.push({ name: 'details', params: { id: row.id } });
}
function goPublish() {
    router.push({ name: 'additem' });
}
async function closeOne(row: Item) {
    try {
        await ElMessageBox.confirm(`确认关闭「${row.item_name}」的认领通道？`, '关闭', { type: 'warning' });
    } catch {
        return;
    }
    const res = await closeItem(row.id);
    if (res?.code === 0) {
        ElMessage.success('已关闭认领通道');
        load();
    } else {
        ElMessage.error(res?.msg || '操作失败');
    }
}

onMounted(load);
</script>

<style scoped>
.my-items-page {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.toolbar {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 14px;
    flex-wrap: wrap;
}
.toolbar > .el-button {
    margin-left: auto;
}
:deep(.my-date) {
    width: auto !important;
    flex: none;
    padding-left: 6px !important;
    padding-right: 6px !important;
}
:deep(.my-date .el-range-input) {
    min-width: 20px;
    flex: 1 1 0;
    padding-left: 2px !important;
    padding-right: 2px !important;
}
:deep(.my-date .el-range-input:first-of-type) {
    text-align: right !important;
}
:deep(.my-date .el-range-input:first-of-type)::placeholder {
    text-align: right !important;
}
:deep(.my-date .el-range-input:last-of-type) {
    text-align: left;
}
:deep(.my-date .el-range-input:last-of-type)::placeholder {
    text-align: left;
}
</style>
