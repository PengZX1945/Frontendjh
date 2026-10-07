<template>
    <div class="list-view">
        <SearchPanel v-model:keyword="keyword" v-model:category="category" v-model:date-range="dateRange" />

        <!-- 管理员批量操作栏 -->
        <div v-if="isAdmin" class="admin-batch-bar">
            <template v-if="!batchAction">
                <el-button type="danger" plain @click="startBatch('delete')">批量删除</el-button>
                <el-button type="warning" plain @click="startBatch('close')">批量关闭认领</el-button>
            </template>
            <template v-else>
                <span class="batch-tip">点击卡片选中 / 取消{{ batchAction === 'delete' ? '，确认后删除' : '，确认后关闭认领' }}</span>
                <span class="sel-count">已选 {{ selectedIds.length }} 项</span>
                <el-button type="primary" :disabled="!selectedIds.length" @click="confirmBatch">确认</el-button>
                <el-button @click="cancelBatch">取消</el-button>
            </template>
        </div>

        <div v-if="loading" class="list-loading">
            <el-skeleton :rows="4" animated />
        </div>

        <el-empty v-else-if="!displayItems.length" description="暂无相关信息" />

        <section v-else class="item-grid">
            <div v-for="item in displayItems" :key="item.id" class="card-wrap">
                <ItemCard
                    :item="item"
                    :keyword="keyword"
                    :selectable="!!batchAction"
                    :selected="selectedIds.includes(item.id)"
                    @toggle-select="toggleSelect(item.id)"
                />
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import ItemCard from './ItemCard.vue';
import SearchPanel from './SearchPanel.vue';
import { fetchItems, deleteItem, closeItem } from '../api/items';
import { fetchAdminItems } from '../api/admin';
import { isSuccess, resolveErrorMessage } from '../api/errorCode';
import { filterVisibleItems, ItemStatus, type Item, type ItemType } from '../api/itemMeta';
import { useUserStore } from '../stores/user';

const props = defineProps<{ type: ItemType }>();

const userStore = useUserStore();
const isAdmin = computed(() => userStore.isAdmin);

const keyword = ref('');
const category = ref('');
const dateRange = ref<Array<string> | null>(null);
const items = ref<Item[]>([]);
const loading = ref(false);
/** 当前批量操作类型：delete=删除选择 / close=关闭认领选择 / null=未进入选择 */
const batchAction = ref<'delete' | 'close' | null>(null);
/** 管理员批量选中的物品 id */
const selectedIds = ref<number[]>([]);

/** 管理员能看到所有帖子，普通用户只看已发布 / 已认领 */
const visibleItems = computed(() => filterVisibleItems(items.value, userStore.isAdmin));

/** 可关闭认领的物品状态：待审核 / 已发布（已认领、已关闭等不可关闭） */
const CLOSEABLE_STATUSES: readonly number[] = [ItemStatus.PENDING, ItemStatus.PUBLISHED];
/** 展示列表：批量关闭选择态只显示可关闭认领的物品，其余正常 */
const displayItems = computed(() => {
    if (batchAction.value === 'close') {
        return visibleItems.value.filter((i) => CLOSEABLE_STATUSES.includes(i.status));
    }
    return visibleItems.value;
});

/** 进入对应批量选择状态 */
function startBatch(action: 'delete' | 'close'): void {
    batchAction.value = action;
    selectedIds.value = [];
}
/** 取消：退出选择状态并清空选择 */
function cancelBatch(): void {
    batchAction.value = null;
    selectedIds.value = [];
}
/** 确认：按当前操作类型执行批量删除 / 关闭 */
function confirmBatch(): void {
    if (batchAction.value === 'delete') {
        batchDelete();
    } else if (batchAction.value === 'close') {
        batchClose();
    }
}
function toggleSelect(id: number): void {
    if (selectedIds.value.includes(id)) {
        selectedIds.value = selectedIds.value.filter((x) => x !== id);
    } else {
        selectedIds.value = [...selectedIds.value, id];
    }
}

async function load(): Promise<void> {
    loading.value = true;
    try {
        const base = {
            keyword: keyword.value || undefined,
            category: category.value || undefined,
            start_time: dateRange.value?.[0],
            end_time: dateRange.value?.[1],
        };
        // 管理员：查看该类型所有状态的物品；普通用户：公开列表（已发布）
        const res = isAdmin.value
            ? await fetchAdminItems({ ...base, type: props.type, page_size: 50 })
            : await fetchItems({ type: props.type, ...base });

        if (isSuccess(res?.code)) {
            items.value = res.data ?? [];
            // 清理已被删除/已不在列表中的选择
            const ids = new Set(items.value.map((i) => i.id));
            selectedIds.value = selectedIds.value.filter((x) => ids.has(x));
            return;
        }

        ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '加载失败，请稍后重试');
    } finally {
        loading.value = false;
    }
}

/** 批量删除：逐个调用 DELETE /items/:id */
async function batchDelete(): Promise<void> {
    if (!selectedIds.value.length) return;
    let ok = 0;
    for (const id of [...selectedIds.value]) {
        const res = await deleteItem(id);
        if (res?.code === 0) ok += 1;
    }
    ElMessage.success(`已删除 ${ok} 个物品`);
    batchAction.value = null;
    selectedIds.value = [];
    load();
}

/** 批量关闭认领：逐个调用 POST /items/:id/close */
async function batchClose(): Promise<void> {
    if (!selectedIds.value.length) return;
    let ok = 0;
    for (const id of [...selectedIds.value]) {
        const res = await closeItem(id);
        if (res?.code === 0) ok += 1;
    }
    ElMessage.success(`已关闭 ${ok} 个物品的认领`);
    batchAction.value = null;
    selectedIds.value = [];
    load();
}

// 切换招领 / 寻物、或改了搜索条件都重新拉一次
watch([() => props.type, keyword, category, dateRange], load, { immediate: true });
</script>

<style scoped>
.admin-batch-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
    padding: 10px 14px;
    background: #fff;
    border: 1px solid #e8ecf1;
    border-radius: 8px;
}
.batch-tip {
    font-size: 13px;
    color: #909399;
}
.sel-count {
    margin-left: auto;
    font-size: 13px;
    color: #409eff;
    font-weight: 500;
}
.item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-top: 20px;
}
.list-loading {
    margin-top: 20px;
    padding: 24px;
    background: #fff;
    border-radius: 6px;
}
</style>
