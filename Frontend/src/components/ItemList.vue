<template>
    <div class="list-view">
        <SearchPanel v-model:keyword="keyword" v-model:category="category" />

        <div v-if="loading" class="list-loading">
            <el-skeleton :rows="4" animated />
        </div>

        <el-empty v-else-if="!visibleItems.length" description="暂无相关信息" />

        <section v-else class="item-grid">
            <ItemCard v-for="item in visibleItems" :key="item.id" :item="item" />
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import ItemCard from './ItemCard.vue';
import SearchPanel from './SearchPanel.vue';
import { fetchItems } from '../api/items';
import { isSuccess, resolveErrorMessage } from '../api/errorCode';
import { filterVisibleItems, type Item, type ItemType } from '../api/itemMeta';
import { useUserStore } from '../stores/user';

const props = defineProps<{ type: ItemType }>();

const userStore = useUserStore();

const keyword = ref('');
const category = ref('');
const items = ref<Item[]>([]);
const loading = ref(false);

/** 管理员能看到所有帖子，普通用户只看已发布 / 已认领 */
const visibleItems = computed(() => filterVisibleItems(items.value, userStore.isAdmin));

async function load(): Promise<void> {
    loading.value = true;
    try {
        const res = await fetchItems({
            type: props.type,
            keyword: keyword.value || undefined,
            category: category.value || undefined,
        });

        if (isSuccess(res?.code)) {
            items.value = res.data ?? [];
            return;
        }

        ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '加载失败，请稍后重试');
    } finally {
        loading.value = false;
    }
}

// 切换招领 / 寻物、或改了搜索条件都重新拉一次
watch([() => props.type, keyword, category], load, { immediate: true });
</script>

<style scoped>
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
