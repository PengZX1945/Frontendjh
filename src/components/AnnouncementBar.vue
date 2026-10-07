<template>
    <div v-if="announcements.length" class="announce-bar" @click="openDialog">
        <span class="announce-tag">📢 公告</span>
        <div class="announce-items">
            <span v-for="(a, i) in announcements" :key="a.id" class="announce-title">
                <template v-if="i > 0"><span class="sep">·</span></template>{{ a.title }}
            </span>
        </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="active?.title ?? '公告'" width="520px" append-to-body>
        <div class="announce-content">{{ active?.content }}</div>
        <template #footer>
            <span class="announce-time">{{ formatTime(active?.created_at) }}</span>
            <el-button type="primary" @click="dialogVisible = false">关闭</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchAnnouncements, type Announcement } from '../api/announcement';
import { isSuccess } from '../api/errorCode';

const announcements = ref<Announcement[]>([]);
const active = ref<Announcement | null>(null);
const dialogVisible = ref(false);

function formatTime(t?: string): string {
    if (!t) return '';
    const d = new Date(t);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function openDialog(): void {
    if (!announcements.value.length) return;
    active.value = announcements.value[0] ?? null;
    dialogVisible.value = true;
}

onMounted(async () => {
    try {
        const res = await fetchAnnouncements(5);
        if (isSuccess(res?.code)) {
            announcements.value = res.data?.announcements ?? [];
        }
    } catch {
        /* 公告加载失败不影响主页面 */
    }
});
</script>

<style scoped>
.announce-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: linear-gradient(90deg, #fff7e6, #fffbe8);
    border: 1px solid #ffe7ba;
    border-radius: 8px;
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
}
.announce-tag {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 600;
    color: #d48806;
}
.announce-items {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
}
.announce-title {
    font-size: 13px;
    color: #8a6d3b;
}
.sep {
    margin-right: 10px;
    color: #e0c9a0;
}
.announce-content {
    font-size: 14px;
    line-height: 1.7;
    color: #303133;
    white-space: pre-wrap;
    word-break: break-word;
}
.announce-time {
    font-size: 12px;
    color: #909399;
    margin-right: auto;
}
</style>
