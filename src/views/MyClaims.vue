<template>
    <div class="my-claims-page">
        <h2 class="page-title">我的认领申请</h2>

        <el-table :data="claims" v-loading="loading" border>
            <el-table-column label="物品" min-width="130">
                <template #default="{ row }">
                    <a class="item-link" @click="goItem(row.item_id)">
                        {{ itemNames[row.item_id] || `物品 #${row.item_id}` }}
                    </a>
                </template>
            </el-table-column>
            <el-table-column prop="reason" label="认领理由" min-width="150" show-overflow-tooltip />
            <el-table-column prop="applicant_contact" label="联系方式" min-width="110" />
            <el-table-column label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="claimTagType(row.claim_status)">{{ claimStatusText(row.claim_status) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="申请时间" min-width="150">
                <template #default="{ row }">{{ formatTime(row.created_time) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="210" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" @click="goItem(row.item_id)">物品</el-button>
                    <el-button size="small" @click="openDetail(row)">详情</el-button>
                    <el-button v-if="row.claim_status === ClaimStatus.PENDING" size="small" type="primary" plain @click="openEdit(row)">修改</el-button>
                    <el-button v-if="row.claim_status === ClaimStatus.PENDING" size="small" type="danger" plain @click="doDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!loading && claims.length === 0" description="还没有认领申请" />

        <!-- 认领详情弹窗 -->
        <el-dialog v-model="detailVisible" title="认领申请详情" width="520px">
            <el-descriptions v-if="detail" :column="1" border>
                <el-descriptions-item label="申请编号">{{ detail.claim_id }}</el-descriptions-item>
                <el-descriptions-item label="关联物品">#{{ detail.item_id }} {{ itemNames[detail.item_id] || '' }}</el-descriptions-item>
                <el-descriptions-item label="认领理由">{{ detail.reason }}</el-descriptions-item>
                <el-descriptions-item label="联系方式">{{ detail.applicant_contact }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <el-tag :type="claimTagType(detail.claim_status)">{{ claimStatusText(detail.claim_status) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="申请时间">{{ formatTime(detail.created_time) }}</el-descriptions-item>
                <el-descriptions-item label="最后修改">{{ formatTime(detail.last_edit_time) }}</el-descriptions-item>
            </el-descriptions>
        </el-dialog>

        <!-- 修改认领弹窗 -->
        <el-dialog v-model="editVisible" title="修改认领申请" width="480px" :close-on-click-modal="false">
            <el-form label-width="90px">
                <el-form-item label="认领理由">
                    <el-input v-model="editForm.reason" type="textarea" :rows="3" maxlength="300" placeholder="请说明认领理由" />
                </el-form-item>
                <el-form-item label="联系方式">
                    <el-input v-model="editForm.contact" maxlength="64" placeholder="手机号 / 微信号" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="editVisible = false">取消</el-button>
                <el-button type="primary" :loading="savingEdit" @click="saveEdit">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { fetchMyClaims, fetchClaimDetail, updateClaim, deleteClaim } from '../api/claim';
import { fetchItemDetail } from '../api/items';
import { ClaimStatus, type Claim } from '../api/itemMeta';

const router = useRouter();
const claims = ref<Claim[]>([]);
const loading = ref(false);
/** item_id -> 物品名称（后端认领接口不带物品名，逐个补查） */
const itemNames = ref<Record<number, string>>({});

/** 详情弹窗 */
const detailVisible = ref(false);
const detail = ref<Claim | null>(null);
/** 修改弹窗 */
const editVisible = ref(false);
const savingEdit = ref(false);
const editForm = reactive({ claimId: 0, reason: '', contact: '' });

function claimStatusText(s: number): string {
    return s === 0 ? '待审批' : s === 1 ? '已通过' : s === 2 ? '已驳回' : '未知';
}
function claimTagType(s: number): 'info' | 'success' | 'danger' | 'warning' {
    return s === 0 ? 'info' : s === 1 ? 'success' : s === 2 ? 'danger' : 'warning';
}
function formatTime(t?: string): string {
    return t ? t.replace('T', ' ').slice(0, 19) : '—';
}
function goItem(id: number): void {
    router.push({ name: 'details', params: { id } });
}

/** 查看认领详情：GET /api/claims/:claim_id */
async function openDetail(row: Claim): Promise<void> {
    const res = await fetchClaimDetail(row.claim_id);
    if (res?.code === 0) {
        detail.value = res.data ?? null;
        detailVisible.value = true;
    } else {
        ElMessage.error(res?.msg || '加载详情失败');
    }
}

/** 打开修改弹窗（仅待审批可改） */
function openEdit(row: Claim): void {
    editForm.claimId = row.claim_id;
    editForm.reason = row.reason ?? '';
    editForm.contact = row.applicant_contact ?? '';
    editVisible.value = true;
}

/** 保存修改：PUT /api/claims/:claim_id */
async function saveEdit(): Promise<void> {
    if (!editForm.reason.trim() || !editForm.contact.trim()) {
        ElMessage.warning('理由和联系方式不能为空');
        return;
    }
    savingEdit.value = true;
    try {
        const res = await updateClaim(editForm.claimId, editForm.reason.trim(), editForm.contact.trim());
        if (res?.code === 0) {
            ElMessage.success('认领申请已更新');
            editVisible.value = false;
            load();
        } else {
            ElMessage.error(res?.msg || '更新失败');
        }
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '更新失败');
    } finally {
        savingEdit.value = false;
    }
}

/** 删除认领申请：DELETE /api/claims/:claim_id/（仅待审批） */
async function doDelete(row: Claim): Promise<void> {
    try {
        await ElMessageBox.confirm('确定删除该认领申请？删除后不可恢复。', '删除申请', { type: 'warning' });
    } catch {
        return;
    }
    const res = await deleteClaim(row.claim_id);
    if (res?.code === 0) {
        ElMessage.success('认领申请已删除');
        load();
    } else {
        ElMessage.error(res?.msg || '删除失败');
    }
}

async function load(): Promise<void> {
    loading.value = true;
    try {
        const res = await fetchMyClaims();
        if (res?.code !== 0) {
            ElMessage.error(res?.msg || '加载失败');
            return;
        }
        claims.value = res.data ?? [];

        const names: Record<number, string> = {};
        await Promise.all(
            claims.value.map(async (c) => {
                try {
                    const d = await fetchItemDetail(c.item_id);
                    if (d?.code === 0 && d.data) names[c.item_id] = d.data.item_name;
                } catch {
                    /* 单个补查失败则回退显示物品 #id */
                }
            }),
        );
        itemNames.value = names;
    } catch (err) {
        ElMessage.error(err instanceof Error ? err.message : '加载失败');
    } finally {
        loading.value = false;
    }
}

onMounted(load);
</script>

<style scoped>
.my-claims-page {
    background: #fff;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.page-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
}
.item-link {
    color: #409eff;
    cursor: pointer;
}
.item-link:hover {
    text-decoration: underline;
}
</style>
