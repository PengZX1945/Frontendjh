<template>
    <div class="admin-announcements">
        <div class="page-head">
            <h2>公告管理</h2>
            <span class="page-sub">仅系统管理员可创建 / 编辑 / 删除公告，所有用户可见</span>
        </div>

        <div class="toolbar">
            <el-button type="primary" @click="openCreate">新建公告</el-button>
        </div>

        <div v-if="loading" class="load-box">
            <el-skeleton :rows="4" animated />
        </div>

        <el-table v-else :data="list" border stripe>
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column label="内容" min-width="280" show-overflow-tooltip>
                <template #default="{ row }">{{ row.content }}</template>
            </el-table-column>
            <el-table-column label="创建时间" width="170">
                <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center">
                <template #default="{ row }">
                    <el-button size="small" type="primary" plain @click="openEdit(row)">编辑</el-button>
                    <el-button size="small" type="danger" plain @click="remove(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!loading && !list.length" description="暂无公告" />

        <el-dialog v-model="dialogVisible" :title="editing ? '编辑公告' : '新建公告'" width="560px" append-to-body>
            <el-form label-width="60px">
                <el-form-item label="标题">
                    <el-input v-model="form.title" maxlength="128" placeholder="请输入公告标题" />
                </el-form-item>
                <el-form-item label="内容">
                    <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请输入公告内容" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :disabled="!form.title.trim() || !form.content.trim()" @click="save">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    type Announcement,
} from '../api/announcement';
import { isSuccess, resolveErrorMessage } from '../api/errorCode';

const list = ref<Announcement[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editing = ref<Announcement | null>(null);
const form = ref({ title: '', content: '' });

function formatTime(t?: string): string {
    if (!t) return '';
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

async function load(): Promise<void> {
    loading.value = true;
    try {
        const res = await fetchAnnouncements(100);
        if (isSuccess(res?.code)) {
            list.value = res.data?.announcements ?? [];
        } else {
            ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
        }
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '加载失败');
    } finally {
        loading.value = false;
    }
}

function openCreate(): void {
    editing.value = null;
    form.value = { title: '', content: '' };
    dialogVisible.value = true;
}

function openEdit(row: Announcement): void {
    editing.value = row;
    form.value = { title: row.title, content: row.content };
    dialogVisible.value = true;
}

async function save(): Promise<void> {
    if (editing.value) {
        const res = await updateAnnouncement(editing.value.id, form.value.title.trim(), form.value.content.trim());
        if (isSuccess(res?.code)) {
            ElMessage.success('公告已更新');
        } else {
            ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
            return;
        }
    } else {
        const res = await createAnnouncement(form.value.title.trim(), form.value.content.trim());
        if (isSuccess(res?.code)) {
            ElMessage.success('公告已创建');
        } else {
            ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
            return;
        }
    }
    dialogVisible.value = false;
    load();
}

async function remove(row: Announcement): Promise<void> {
    try {
        await ElMessageBox.confirm(`确定删除公告「${row.title}」？`, '删除公告', { type: 'warning' });
    } catch {
        return;
    }
    const res = await deleteAnnouncement(row.id);
    if (isSuccess(res?.code)) {
        ElMessage.success('公告已删除');
        load();
    } else {
        ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
    }
}

onMounted(load);
</script>

<style scoped>
.admin-announcements {
    padding: 8px;
}
.page-head {
    margin-bottom: 16px;
}
.page-head h2 {
    margin: 0 0 4px;
    font-size: 18px;
    color: #303133;
}
.page-sub {
    font-size: 13px;
    color: #909399;
}
.toolbar {
    margin-bottom: 14px;
}
.load-box {
    padding: 24px;
    background: #fff;
    border-radius: 6px;
}
</style>
