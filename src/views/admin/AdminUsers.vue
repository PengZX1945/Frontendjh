<template>
    <div class="admin-users">
        <div class="page-head">
            <h2>用户管理</h2>
            <span class="page-sub">管理系统用户：修改角色、启用 / 禁用账号</span>
        </div>

        <!-- 筛选区 -->
        <div class="filter-bar">
            <el-input
                v-model="keyword"
                placeholder="搜索用户名 / 昵称"
                clearable
                class="kw-input"
                @keyup.enter="search"
                @clear="search"
            />
            <el-select v-model="roleFilter" placeholder="全部角色" clearable class="role-select" @change="search">
                <el-option label="普通用户" value="user" />
                <el-option label="物品管理员" value="finder_admin" />
                <el-option label="系统管理员" value="sys_admin" />
            </el-select>
            <el-button type="primary" @click="search">查询</el-button>
        </div>

        <div v-if="loading" class="load-box">
            <el-skeleton :rows="4" animated />
        </div>

        <el-table v-else :data="users" border stripe class="users-table">
            <el-table-column prop="user_id" label="ID" width="70" align="center" />
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="nickname" label="昵称" min-width="120" />
            <el-table-column label="角色" min-width="120">
                <template #default="{ row }">
                    <el-tag :type="roleTagType(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                        {{ row.status === 1 ? '启用' : '禁用' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="contact" label="联系方式" min-width="140" />
            <el-table-column label="操作" width="200" align="center">
                <template #default="{ row }">
                    <template v-if="!isSelf(row) && row.role !== 'sys_admin'">
                        <el-select
                            :model-value="row.role"
                            size="small"
                            class="role-edit"
                            @change="(v: string) => changeRole(row, v)"
                        >
                            <el-option label="普通用户" value="user" />
                            <el-option label="物品管理员" value="finder_admin" />
                        </el-select>
                        <el-button
                            size="small"
                            :type="row.status === 1 ? 'warning' : 'success'"
                            plain
                            @click="toggleStatus(row)"
                        >{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
                    </template>
                    <span v-else class="muted">—</span>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next, total"
            class="pager"
            @current-change="load"
        />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
    fetchAdminUsers,
    updateUserRole,
    updateUserStatus,
    type AdminUserItem,
} from '../../api/user';
import { isSuccess, resolveErrorMessage } from '../../api/errorCode';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();
const ROLE_LABEL: Record<string, string> = {
    user: '普通用户',
    finder_admin: '物品管理员',
    sys_admin: '系统管理员',
};
function roleLabel(role: string): string {
    return ROLE_LABEL[role] ?? role;
}
function roleTagType(role: string): 'primary' | 'warning' | 'danger' | 'info' {
    if (role === 'sys_admin') return 'danger';
    if (role === 'finder_admin') return 'warning';
    return 'info';
}
function isSelf(row: AdminUserItem): boolean {
    return row.user_id === userStore.userId;
}

const keyword = ref('');
const roleFilter = ref('');
const users = ref<AdminUserItem[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

async function load(): Promise<void> {
    loading.value = true;
    try {
        const res = await fetchAdminUsers({
            keyword: keyword.value || undefined,
            role: roleFilter.value || undefined,
            page: page.value,
            page_size: pageSize.value,
        });
        if (isSuccess(res?.code)) {
            users.value = res.data?.users ?? [];
            total.value = users.value.length; // 后端当前未返回总数，暂以当页条数展示
            return;
        }
        ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '加载失败，请稍后重试');
    } finally {
        loading.value = false;
    }
}

function search(): void {
    page.value = 1;
    load();
}

async function changeRole(row: AdminUserItem, role: string): Promise<void> {
    const res = await updateUserRole(row.user_id, role);
    if (isSuccess(res?.code)) {
        ElMessage.success(`已将「${row.username}」设为${roleLabel(role)}`);
        load();
    } else {
        ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
    }
}

async function toggleStatus(row: AdminUserItem): Promise<void> {
    const next = row.status === 1 ? 0 : 1;
    const res = await updateUserStatus(row.user_id, next);
    if (isSuccess(res?.code)) {
        ElMessage.success(`已${next === 1 ? '启用' : '禁用'}「${row.username}」`);
        load();
    } else {
        ElMessage.error(resolveErrorMessage(res?.code, res?.msg));
    }
}

load();
</script>

<style scoped>
.admin-users {
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
.filter-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
}
.kw-input {
    width: 220px;
}
.role-select {
    width: 150px;
}
.load-box {
    padding: 24px;
    background: #fff;
    border-radius: 6px;
}
.users-table {
    background: #fff;
}
.role-edit {
    width: 118px;
    margin-right: 8px;
}
.muted {
    color: #c0c4cc;
    font-size: 13px;
}
.pager {
    justify-content: center;
    margin-top: 16px;
}
</style>
