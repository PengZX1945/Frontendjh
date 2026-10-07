<template>
    <div class="item-detail-page">
        <button class="back-btn" @click="goBack">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            返回
        </button>

        <div v-loading="loading">
            <el-empty v-if="!loading && !item" description="物品不存在或无权查看" />

            <div v-if="item" class="detail-card">
                <!-- 头部：类型 + 名称 + 状态 -->
                <div class="detail-head">
                    <div class="head-left">
                        <span class="type-chip" :class="item.type === 'found' ? 'is-found' : 'is-lost'">
                            {{ item.type === 'found' ? '招领' : '寻物' }}
                        </span>
                        <h2 class="title">{{ item.item_name }}</h2>
                        <StatusTag :status="item.status" />
                    </div>
                </div>

                <!-- 驳回：醒目强调 -->
                <div v-if="isRejected" class="reject-banner">
                    <div class="reject-icon">
                        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
                            <path d="M12 9v4"/><path d="M12 17h.01"/>
                        </svg>
                    </div>
                    <div class="reject-body">
                        <div class="reject-title">未通过审核</div>
                        <div class="reject-reason">
                            <span class="reject-label">驳回理由：</span>
                            <strong class="reject-value">{{ item.reject_reason }}</strong>
                        </div>
                        <div class="reject-hint">请根据驳回理由修改物品信息后重新发布</div>
                    </div>
                </div>

                <div class="detail-body">
                    <!-- 图片区 -->
                    <div class="gallery">
                        <el-image
                            v-for="(img, idx) in item.images"
                            :key="idx"
                            :src="img"
                            :preview-src-list="item.images"
                            :initial-index="idx"
                            fit="cover"
                            class="gallery-img"
                        />
                        <div v-if="item.images.length === 0" class="no-img">暂无图片</div>
                    </div>

                    <!-- 信息区 -->
                    <div class="info">
                        <el-descriptions :column="1" border class="desc-table">
                            <el-descriptions-item label="分类">{{ item.category }}</el-descriptions-item>
                            <el-descriptions-item label="地点">{{ item.location || '—' }}</el-descriptions-item>
                            <el-descriptions-item label="发生时间">{{ item.happen_time || '—' }}</el-descriptions-item>
                            <el-descriptions-item label="联系方式">{{ item.contact || '—' }}</el-descriptions-item>
                            <el-descriptions-item label="发布时间">{{ item.created_at || '—' }}</el-descriptions-item>
                        </el-descriptions>

                        <div class="desc-block">
                            <div class="desc-label">物品描述</div>
                            <p class="desc-text">{{ item.description || '暂无描述' }}</p>
                        </div>

                        <div class="actions">
                            <el-button v-if="showClaim" type="primary" :disabled="applied" @click="handleClaimClick">{{ applied ? '已申请认领' : '申请认领' }}</el-button>
                            <el-button v-if="canEdit" type="primary" plain @click="editVisible = true">编辑物品</el-button>
                            <el-button v-if="canClose" type="warning" @click="doClose">关闭认领通道</el-button>
                            <el-button v-if="canDelete" type="danger" plain @click="doDelete">删除物品</el-button>
                            <el-button v-if="canReview" type="success" @click="doReview('approve')">通过审核</el-button>
                            <el-button v-if="canReview" type="danger" @click="doReview('reject')">驳回</el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <EditItemDialog v-model="editVisible" :item="item" @saved="onEdited" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import StatusTag from '../components/StatusTag.vue';
import { fetchItemDetail, closeItem, deleteItem } from '../api/items';
import { submitClaim } from '../api/claim';
import { reviewItem } from '../api/admin';
import EditItemDialog from '../components/EditItemDialog.vue';
import { useUserStore } from '../stores/user';
import { useAuthStore } from '../stores/ui';
import { ItemStatus, type Item } from '../api/itemMeta';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();

const item = ref<Item | null>(null);
const loading = ref(false);
/** 本会话内已对该物品提交过认领：按钮变禁用态，从源头防重复申请 */
const applied = ref(false);
/** 编辑物品弹窗开关（仅发布者本人可编辑） */
const editVisible = ref(false);

const itemId = computed(() => Number(route.params.id));
const isMine = computed(() => userStore.isLoggedIn && userStore.userId === item.value?.poster_id);
/** 是否被驳回（用于强调展示驳回理由） */
const isRejected = computed(
    () => item.value?.status === ItemStatus.REJECTED && Boolean(item.value?.reject_reason),
);

/** 已发布的招领物，非本人即可申请认领（游客点击先弹登录/注册窗） */
const showClaim = computed(
    () =>
        item.value?.type === 'found' &&
        item.value.status === ItemStatus.PUBLISHED &&
        !isMine.value,
);
/** 仅发布者本人、且物品处于 待审核/已驳回/已发布 状态时可编辑；已认领/已关闭不可编辑 */
const canEdit = computed(
    () =>
        isMine.value &&
        item.value != null &&
        ([ItemStatus.PENDING, ItemStatus.REJECTED, ItemStatus.PUBLISHED] as number[]).includes(item.value.status),
);
/** 发布者本人或管理员可关闭认领通道 */
const canClose = computed(
    () => item.value?.status === ItemStatus.PUBLISHED && (userStore.isAdmin || isMine.value),
);
/** 管理员可审核待审物品 */
const canReview = computed(() => userStore.isAdmin && item.value?.status === ItemStatus.PENDING);
/** 发布者本人或管理员可删除物品（任意状态） */
const canDelete = computed(() => userStore.isAdmin || isMine.value);

async function load() {
    loading.value = true;
    applied.value = false;
    try {
        const res = await fetchItemDetail(itemId.value);
        if (res?.code === 0 && res.data) item.value = res.data;
        else item.value = null;
    } catch {
        item.value = null;
    } finally {
        loading.value = false;
    }
}

/** 点击认领：已登录直接弹理由输入；游客先弹登录/注册窗，登录后跳回本页 */
function handleClaimClick(e?: MouseEvent) {
    if (userStore.isLoggedIn) {
        openClaim();
        return;
    }
    // 登录/注册弹窗已打开：保持弹窗，不重复提示，并阻止本次点击冒泡触发“点击外部关闭”
    if (authStore.visible) {
        e?.stopPropagation();
        return;
    }
    // 先关掉旧提示再弹新的一条：既覆盖不堆叠，又保留每次的淡入动画
    ElMessage.closeAll();
    ElMessage.info('请先登录');
    authStore.openAuth('login', route.fullPath);
}

async function openClaim() {
    try {
        const { value } = await ElMessageBox.prompt(
            '请说明认领理由（例如物品特征、丢失的时间地点）',
            '申请认领',
            {
                inputType: 'textarea',
                inputPlaceholder: '请填写认领理由',
                inputValidator: (v: string) => (v && v.trim() ? true : '认领理由不能为空'),
            },
        );
        const res = await submitClaim(itemId.value, (value || '').trim());
        if (res?.code === 0) {
            applied.value = true;
            ElMessage.success('认领申请已提交，等待管理员审批');
        } else {
            ElMessage.error(res?.msg || '提交失败');
        }
    } catch (err) {
        // 用户主动取消 / 关闭理由输入框：静默不提示
        if (err === 'cancel' || err === 'close') return;
        // 后端 HTTP 非 2xx（如重复认领 409）会抛到这里：给出明确提示
        ElMessage.error(err instanceof Error ? err.message : (err && typeof err === 'object' && (err as { msg?: string }).msg) || '提交失败');
    }
}

async function doClose() {
    try {
        await ElMessageBox.confirm('关闭后将无法再认领该物品，确认关闭？', '关闭认领通道', {
            type: 'warning',
        });
    } catch {
        return;
    }
    const res = await closeItem(itemId.value);
    if (res?.code === 0) {
        ElMessage.success('已关闭认领通道');
        load();
    } else {
        ElMessage.error(res?.msg || '操作失败');
    }
}

/** 删除物品（仅本人或管理员）；成功后回到对应列表页 */
async function doDelete() {
    try {
        await ElMessageBox.confirm('确定删除该物品？删除后不可恢复。', '删除物品', {
            type: 'warning',
        });
    } catch {
        return;
    }
    const res = await deleteItem(itemId.value);
    if (res?.code === 0) {
        ElMessage.success('物品已删除');
        router.push({ name: item.value?.type === 'found' ? 'found' : 'lost' });
    } else {
        ElMessage.error(res?.msg || '删除失败');
    }
}

async function doReview(option: 'approve' | 'reject') {
    let reason = '';
    if (option === 'reject') {
        try {
            const { value } = await ElMessageBox.prompt('请输入驳回理由', '驳回', {
                inputType: 'textarea',
                inputValidator: (v: string) => (v && v.trim() ? true : '理由不能为空'),
            });
            reason = (value || '').trim();
        } catch {
            return;
        }
    }
    const res = await reviewItem(itemId.value, option, reason);
    if (res?.code === 0) {
        ElMessage.success(option === 'approve' ? '已通过审核' : '已驳回');
        load();
    } else {
        ElMessage.error(res?.msg || '操作失败');
    }
}

function goBack() {
    router.back();
}

/** 编辑保存成功后关闭弹窗并刷新详情 */
function onEdited(): void {
    editVisible.value = false;
    load();
}

onMounted(load);
</script>
<style scoped>
.item-detail-page {
    max-width: 880px;
    margin: 0 auto;
}
.back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    padding: 6px 14px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    background: #fff;
    color: #606266;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
}
.back-btn:hover {
    color: #409eff;
    border-color: #c6e2ff;
    background: #ecf5ff;
}
.detail-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}
.detail-head {
    padding: 20px 26px 0;
}
.head-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}
.type-chip {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
}
.type-chip.is-found { background: #67c23a; }
.type-chip.is-lost  { background: #e6a23c; }
.title {
    margin: 0;
    font-size: 22px;
    color: #303133;
    line-height: 1.3;
}

/* —— 驳回强调 —— */
.reject-banner {
    display: flex;
    gap: 14px;
    margin: 16px 26px 0;
    padding: 16px 18px;
    border-radius: 10px;
    background: linear-gradient(135deg, #fff1f0 0%, #ffecf0 100%);
    border: 1px solid #fbc4c4;
    border-left: 4px solid #f56c6c;
    box-shadow: 0 1px 6px rgba(245, 108, 108, 0.15);
}
.reject-icon {
    flex: 0 0 40px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f56c6c;
    color: #fff;
}
.reject-body { flex: 1; min-width: 0; }
.reject-title {
    font-size: 16px;
    font-weight: 700;
    color: #d03050;
    margin-bottom: 6px;
}
.reject-reason {
    font-size: 15px;
    color: #b3271e;
    margin-bottom: 4px;
}
.reject-label { color: #c45656; }
.reject-value {
    font-weight: 700;
    color: #d03050;
}
.reject-hint {
    font-size: 12px;
    color: #d08b8b;
}

.detail-body {
    display: flex;
    gap: 28px;
    padding: 20px 26px 26px;
}
.gallery {
    flex: 0 0 320px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-content: flex-start;
}
.gallery-img {
    width: 152px;
    height: 152px;
    border-radius: 8px;
    display: block;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.no-img {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: #f0f2f5;
    color: #909399;
    font-size: 13px;
}
.info {
    flex: 1;
    min-width: 0;
}
.desc-table {
    font-size: 13px;
}
.desc-block { margin-top: 18px; }
.desc-label {
    font-size: 13px;
    color: #909399;
    margin-bottom: 6px;
}
.desc-text {
    margin: 0;
    font-size: 14px;
    line-height: 1.75;
    color: #303133;
    white-space: pre-wrap;
}
.actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    flex-wrap: wrap;
}
</style>
