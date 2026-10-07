<template>
    <div class="admin-stats">
        <div class="page-head">
            <h2>数据统计</h2>
            <span class="page-sub">全校发布趋势与各项数据概览</span>
        </div>

        <div v-if="loading" class="load-box"><el-skeleton :rows="5" animated /></div>

        <template v-else>
            <!-- 统计卡片 -->
            <div class="stat-grid">
                <div class="stat-card">
                    <span class="stat-label">物品总数</span>
                    <span class="stat-num">{{ ov?.items_total ?? 0 }}</span>
                </div>
                <div class="stat-card found">
                    <span class="stat-label">招领物品</span>
                    <span class="stat-num">{{ ov?.found_total ?? 0 }}</span>
                </div>
                <div class="stat-card lost">
                    <span class="stat-label">寻物物品</span>
                    <span class="stat-num">{{ ov?.lost_total ?? 0 }}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">注册用户</span>
                    <span class="stat-num">{{ ov?.users_total ?? 0 }}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">认领申请</span>
                    <span class="stat-num">{{ ov?.claims_total ?? 0 }}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">公告</span>
                    <span class="stat-num">{{ ov?.announcements_total ?? 0 }}</span>
                </div>
            </div>

            <!-- 状态分布 -->
            <div class="status-stats">
                <div v-for="s in statusList" :key="s.label" class="status-card">
                    <span class="status-dot" :style="{ background: s.color }"></span>
                    <div>
                        <div class="status-name">{{ s.label }}</div>
                        <div class="status-count">{{ s.count }}</div>
                    </div>
                </div>
            </div>

            <!-- 发布趋势图 -->
            <div class="chart-card">
                <div class="chart-head">
                    <h3>近 30 天发布趋势</h3>
                    <div class="legend">
                        <span class="lg"><i class="dot" style="background:#409eff"></i>全部</span>
                        <span class="lg"><i class="dot" style="background:#67c23a"></i>招领</span>
                        <span class="lg"><i class="dot" style="background:#e6a23c"></i>寻物</span>
                    </div>
                </div>
                <div ref="wrapRef" class="trend-wrap" @mousemove="onMove" @mouseleave="activeIndex = -1">
                    <svg class="trend-svg" viewBox="0 0 900 260" preserveAspectRatio="xMidYMid meet">
                        <!-- 网格横线 -->
                        <line v-for="y in gridLines" :key="y" x1="46" :y1="y" x2="890" :y2="y" stroke="#f0f2f5" />
                        <!-- 折线 -->
                        <polyline v-for="l in lines" :key="l.key" :points="l.points" fill="none" :stroke="l.color"
                            stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
                        <!-- 数据点 -->
                        <circle v-for="(p, i) in polyPoints" :key="'d'+i" :cx="p.x" :cy="p.y" r="3" fill="#409eff" />
                        <!-- 悬停竖线 + 高亮点 -->
                        <line v-if="activeIndex >= 0" :x1="xOf(activeIndex)" :y1="PAD_T" :x2="xOf(activeIndex)" :y2="H - PAD_B"
                            stroke="#409eff" stroke-width="1.2" stroke-dasharray="4 3" />
                        <circle v-if="activePoint" :cx="xOf(activeIndex)" :cy="yOf(activePoint.total)" r="4"
                            fill="#409eff" stroke="#fff" stroke-width="1.5" />
                        <!-- Y轴刻度 -->
                        <text v-for="gy in yTicks" :key="'y'+gy" x="40" :y="yOf(gy)" text-anchor="end" class="axis-text">{{ gy }}</text>
                        <!-- X轴日期 -->
                        <text v-for="xl in xLabels" :key="'x'+xl.i" :x="xl.x" y="248" text-anchor="middle" class="axis-text">{{ xl.text }}</text>
                    </svg>
                    <!-- 悬停数值提示 -->
                    <div v-if="activePoint" class="trend-tip" :style="{ left: tipLeft + 'px' }">
                        <div class="tip-date">{{ activePoint.date }}</div>
                        <div class="tip-row"><span class="tip-c total"></span>全部 <b>{{ activePoint.total }}</b></div>
                        <div class="tip-row"><span class="tip-c found"></span>招领 <b>{{ activePoint.found }}</b></div>
                        <div class="tip-row"><span class="tip-c lost"></span>寻物 <b>{{ activePoint.lost }}</b></div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { fetchOverview, fetchTrend, type OverviewStats, type TrendPoint } from '../api/stats';
import { isSuccess, resolveErrorMessage } from '../api/errorCode';
import { ElMessage } from 'element-plus';

const ov = ref<OverviewStats | null>(null);
const trend = ref<TrendPoint[]>([]);
const loading = ref(true);

const STATUS_META: Record<number, { label: string; color: string }> = {
    0: { label: '待审核', color: '#e6a23c' },
    1: { label: '已发布', color: '#409eff' },
    2: { label: '已驳回', color: '#f56c6c' },
    3: { label: '已认领', color: '#67c23a' },
};
const statusList = computed(() =>
    (ov.value?.status_stats ?? []).map((s) => ({ ...(STATUS_META[s.status] ?? { label: '未知', color: '#909399' }), count: s.count })),
);

/** 趋势图几何：SVG 视口 900x260，左边留 46px 放 Y 轴刻度，底部留 30px 放日期 */
const W = 900, H = 260, PAD_L = 46, PAD_R = 14, PAD_T = 12, PAD_B = 30;
const maxVal = computed(() => Math.max(1, ...trend.value.map((p) => p.total)));
const yTicks = computed(() => {
    const max = maxVal.value;
    const step = Math.ceil(max / 4);
    return [0, step, step * 2, step * 3, step * 4];
});
function yOf(v: number): number {
    const inner = H - PAD_T - PAD_B;
    return PAD_T + inner - (v / maxVal.value) * inner;
}
function xOf(i: number): number {
    const n = trend.value.length || 1;
    const inner = W - PAD_L - PAD_R;
    return PAD_L + (n === 1 ? inner / 2 : (i / (n - 1)) * inner);
}
const polyPoints = computed(() => trend.value.map((p, i) => ({ x: xOf(i), y: yOf(p.total), total: p.total })));
function linePoints(key: 'total' | 'found' | 'lost'): string {
    return trend.value.map((p, i) => `${xOf(i)},${yOf(p[key])}`).join(' ');
}
const lines = computed(() => [
    { key: 'total', points: linePoints('total'), color: '#409eff' },
    { key: 'found', points: linePoints('found'), color: '#67c23a' },
    { key: 'lost', points: linePoints('lost'), color: '#e6a23c' },
]);
const gridLines = computed(() => yTicks.value.map((t) => yOf(t)));
const xLabels = computed(() => {
    const n = trend.value.length;
    const idxs = n <= 10 ? Array.from({ length: n }, (_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1];
    return idxs.map((i) => ({ i, x: xOf(i), text: trend.value[i]?.date.slice(5) ?? '' }));
});

/** 趋势图鼠标交互：换算 viewBox 坐标 → 最近数据点 */
const wrapRef = ref<HTMLDivElement | null>(null);
const activeIndex = ref(-1);
function onMove(e: MouseEvent): void {
    const wrap = wrapRef.value;
    const n = trend.value.length;
    if (!wrap || !n) return;
    const rect = wrap.getBoundingClientRect();
    const vbX = ((e.clientX - rect.left) / rect.width) * W;
    const inner = W - PAD_L - PAD_R;
    let idx = Math.round(((vbX - PAD_L) / inner) * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    activeIndex.value = idx;
}
/** tooltip 的像素偏移：viewBox 坐标 → 容器实际像素 */
const tipLeft = computed(() => {
    if (activeIndex.value < 0 || !wrapRef.value) return 0;
    const vbX = xOf(activeIndex.value);
    return (vbX / W) * wrapRef.value.clientWidth;
});
/** 当前悬停点的数据 */
const activePoint = computed(() => (activeIndex.value >= 0 ? trend.value[activeIndex.value] : undefined));

onMounted(async () => {
    try {
        const [o, t] = await Promise.all([fetchOverview(), fetchTrend(30)]);
        if (isSuccess(o?.code) && isSuccess(t?.code)) {
            ov.value = o.data ?? null;
            trend.value = t.data?.days ?? [];
        } else {
            ElMessage.error(resolveErrorMessage(o?.code && o.code !== 0 ? o?.code : t?.code, o?.msg || t?.msg));
        }
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : '加载失败');
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.admin-stats {
    padding: 8px;
}
.page-head { margin-bottom: 16px; }
.page-head h2 { margin: 0 0 4px; font-size: 18px; color: #303133; }
.page-sub { font-size: 13px; color: #909399; }
.load-box { padding: 24px; background: #fff; border-radius: 6px; }

.stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 14px;
    margin-bottom: 16px;
}
.stat-card {
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-left: 3px solid #409eff;
}
.stat-card.found { border-left-color: #67c23a; }
.stat-card.lost { border-left-color: #e6a23c; }
.stat-label { font-size: 13px; color: #909399; }
.stat-num { font-size: 26px; font-weight: 700; color: #303133; }

.status-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
}
.status-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: #f8fafc;
    border: 1px solid #eceff3;
    border-radius: 8px;
    min-width: 110px;
}
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-name { font-size: 13px; color: #606266; }
.status-count { font-size: 18px; font-weight: 600; color: #303133; }

.chart-card {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.chart-head h3 { margin: 0; font-size: 15px; color: #303133; }
.legend { display: flex; gap: 14px; font-size: 13px; color: #606266; }
.lg { display: inline-flex; align-items: center; gap: 5px; }
.dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
.trend-svg { width: 100%; height: auto; display: block; }
.trend-wrap { position: relative; cursor: crosshair; }
.trend-tip {
    position: absolute;
    top: 6px;
    transform: translateX(-50%);
    min-width: 110px;
    padding: 8px 12px;
    background: rgba(48, 49, 51, 0.92);
    color: #fff;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.7;
    pointer-events: none;
    white-space: nowrap;
}
.trend-tip .tip-date { font-weight: 600; margin-bottom: 2px; }
.trend-tip .tip-row { display: flex; align-items: center; gap: 5px; }
.trend-tip .tip-row b { margin-left: 4px; }
.tip-c { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.tip-c.total { background: #409eff; }
.tip-c.found { background: #67c23a; }
.tip-c.lost { background: #e6a23c; }
.axis-text { font-size: 12px; fill: #909399; }
</style>
