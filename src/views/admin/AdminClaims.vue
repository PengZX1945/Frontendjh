<template>
    <div class="admin-page">
        <el-tabs v-model="activeStatus" @tab-change="load">
            <el-tab-pane label="待审批" name="0" />
            <el-tab-pane label="已通过" name="1" />
            <el-tab-pane label="已驳回" name="2" />
            <el-tab-pane label="全部" name="" />
        </el-tabs>

        <el-table :data="claims" v-loading="loading" border>
            <el-table-column prop="claim_id" label="申请ID" width="90" />
            <el-table-column label="物品" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">{{ rowName(row) }}</template>
            </el-table-column>
            <el-table-column prop="reason" label="认领理由" min-width="200" show-overflow-tooltip />
            <el-table-column prop="applicant_contact" label="联系方式" width="130" />
            <el-table-column prop="applicant_id" label="申请人ID" width="95" />
            <el-table-column label="状态" width="95">
                <template #default="{ row }">
                    <el-tag :type="statusTag(row.claim_status)" size="small">{{ CLAIM_STATUS_LABEL[row.claim_status] }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="created_time" label="申请时间" min-width="165" />
            <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                    <template v-if="row.claim_status === 0">
                        <el-button size="small" type="success" @click="review(row, 'approve')">通过</el-button>
                        <el-button size="small" type="danger" @click="review(row, 'reject')">驳回</el-button>
                    </template>
                    <span v-else style="color: #c0c4cc">已处理</span>
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!loading && claims.length === 0" description="暂无申请记录" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchAdminClaims, reviewClaim } from '../api/claim';
import { fetchItemDetail } from '../api/items';
import { CLAIM_STATUS_LABEL, type Claim } from '../api/itemMeta';

/** '' 全部；'0'/'1'/'2' 按状态过滤 */
const activeStatus = ref('');
const claims = ref<Claim[]>([]);
const loading = ref(false);
/** item_id → 物品名称，用于列表增强显示 */
const nameMap = ref<Record<number, string>>({});

const statusTag = (s: number) => (s === 0 ? 'warning' : s === 1 ? 'success' : 'info');

async function load() {
    loading.value = true;
    try {
        const params: { claim_status?: number } = {};
        if (activeStatus.value !== '') params.claim_status = Number(activeStatus.value);
        const res = await fetchAdminClaims(params);
        if (res?.code === 0) {
            claims.value = res.data ?? [];
            await fillNames();
        } else {
            ElMessage.error(res?.msg || '加载失败');
        }
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '加载失败');
    } finally {
        loading.value = false;
    }
}

/** 逐条拉取物品名（接口无关联返回，做增强展示，失败不阻塞） */
async function fillNames() {
    const map = { ...nameMap.value };
    await Promise.all(
        claims.value.map(async (c) => {
            if (map[c.item_id]) return;
            try {
                const r = await fetchItemDetail(c.item_id);
                if (r?.code === 0 && r.data) map[c.item_id] = r.data.item_name;
            } catch {
                /* 忽略单个查询失败 */
            }
        }),
    );
    nameMap.value = map;
}

function rowName(c: Claim): string {
    return nameMap.value[c.item_id] ? `${nameMap.value[c.item_id]} (#${c.item_id})` : `#${c.item_id}`;
}

async function review(c: Claim, option: 'approve' | 'reject') {
    const res = await reviewClaim(c.claim_id, option);
    if (res?.code === 0) {
        ElMessage.success(option === 'approve' ? '已通过，物品标记为已认领' : '已驳回');
        load();
    } else {
        ElMessage.error(res?.msg || '操作失败');
    }
}

onMounted(load);
</script>

<style scoped>
.admin-page {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
</style>
