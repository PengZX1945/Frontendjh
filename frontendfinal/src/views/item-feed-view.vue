<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/empty-state.vue'
import FilterBar from '@/components/filter-bar.vue'
import InfiniteSentinel from '@/components/infinite-sentinel.vue'
import ItemCard from '@/components/item-card.vue'
import ItemCardSkeleton from '@/components/item-card-skeleton.vue'
import LoadMoreIndicator from '@/components/load-more-indicator.vue'
import { fetchItemList } from '@/api/item-api'
import { itemCategoryOptions, itemTypeMeta } from '@/constants/domain'
import { usePagedRecords } from '@/composables/use-paged-records'
import type { ItemRecord, ItemType } from '@/types/item'

/**
 * 信息流（旗舰页）。
 *
 * 需求核心：**可以滚动浏览寻物启事**。
 * 实现方式是「按页取数 + 滚动到接近底部自动续页」，因此筛选条件放在 URL 上，
 * 刷新或把链接发给同学都能还原同一个视图；顶部分段控件切换寻物启事 / 失物招领。
 */
const route = useRoute()
const router = useRouter()

/** 每页条数：3 列布局下正好铺满 4 行，滚动节奏舒服 */
const feedPageSize = 12

const feedType = computed<ItemType>(() => (route.params.type === 'found' ? 'found' : 'lost'))
const typeMeta = computed(() => itemTypeMeta[feedType.value])
const otherType = computed<ItemType>(() => (feedType.value === 'lost' ? 'found' : 'lost'))
const otherTypeMeta = computed(() => itemTypeMeta[otherType.value])

function readQueryText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

const keyword = ref(readQueryText(route.query.keyword))
const category = ref(readQueryText(route.query.category))

const { records, hasMore, isInitialLoading, isLoadingMore, errorMessage, loadNextPage, refresh } =
  usePagedRecords<ItemRecord>((page) =>
    fetchItemList(feedType.value, {
      page,
      pageSize: feedPageSize,
      category: category.value,
      keyword: keyword.value,
    }),
  )

const hasFilter = computed(() => keyword.value !== '' || category.value !== '')

const resultHint = computed(() => {
  if (isInitialLoading.value) return '正在获取最新信息…'
  if (hasFilter.value)
    return `已找到 ${records.value.length} 条匹配记录${hasMore.value ? '（继续滚动可加载更多）' : ''}`
  return records.value.length > 0 ? '按发现 / 遗失时间倒序排列' : ''
})

const isSentinelDisabled = computed(
  () => isInitialLoading.value || isLoadingMore.value || !hasMore.value,
)

/** 把筛选条件写回 URL，保证可分享、可刷新 */
async function applyQuery(patch: Record<string, string>): Promise<void> {
  const nextQuery: Record<string, string> = {}
  for (const [key, value] of Object.entries({ ...route.query, ...patch })) {
    if (typeof value === 'string' && value !== '') nextQuery[key] = value
  }
  await router.replace({ name: 'itemFeed', params: { type: feedType.value }, query: nextQuery })
}

function handleKeywordUpdate(value: string): void {
  keyword.value = value
  void applyQuery({ keyword: value })
}

function handleCategoryUpdate(value: string): void {
  category.value = value
  void applyQuery({ category: value })
}

function clearFilters(): void {
  keyword.value = ''
  category.value = ''
  void applyQuery({ keyword: '', category: '' })
}

// 类型或筛选变化即重来一遍；首屏由 immediate 触发
watch(
  () => `${feedType.value}|${keyword.value}|${category.value}`,
  () => {
    void refresh()
  },
  { immediate: true },
)

// 浏览器前进 / 后退或外部改 URL 时，把筛选状态同步回本地
watch(
  () => route.query,
  (nextQuery) => {
    const nextKeyword = readQueryText(nextQuery.keyword)
    const nextCategory = readQueryText(nextQuery.category)
    if (nextKeyword !== keyword.value) keyword.value = nextKeyword
    if (nextCategory !== category.value) category.value = nextCategory
  },
)
</script>

<template>
  <div class="feed-view">
    <section class="feed-hero">
      <div class="content-container feed-hero__inner">
        <p class="eyebrow">{{ typeMeta.label }} · 全校公开</p>
        <h1 class="feed-hero__title display-title">
          {{ feedType === 'lost' ? '丢了东西？让全校帮你找' : '捡到东西？让失主找到你' }}
        </h1>
        <p class="lead feed-hero__lead">{{ typeMeta.description }}</p>

        <div class="feed-hero__actions">
          <RouterLink
            class="btn btn--primary btn--large"
            :to="{ name: 'itemPublish', query: { type: feedType } }"
          >
            {{ typeMeta.actionLabel }}
          </RouterLink>
          <RouterLink
            class="btn btn--quiet btn--large"
            :to="{ name: 'itemFeed', params: { type: otherType } }"
          >
            看看{{ otherTypeMeta.label }}
          </RouterLink>
        </div>

        <dl class="feed-hero__facts">
          <div>
            <dt>当前频道</dt>
            <dd>{{ typeMeta.label }}</dd>
          </div>
          <div>
            <dt>排序</dt>
            <dd>发现 / 遗失时间倒序</dd>
          </div>
          <div>
            <dt>浏览方式</dt>
            <dd>向下滚动自动加载</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="feed-toolbar">
      <div class="content-container">
        <FilterBar
          :keyword="keyword"
          :category="category"
          :category-options="itemCategoryOptions"
          :hint="resultHint"
          @update:keyword="handleKeywordUpdate"
          @update:category="handleCategoryUpdate"
        />
      </div>
    </section>

    <section class="page-section feed-list">
      <div class="content-container">
        <div v-if="isInitialLoading" class="feed-grid">
          <ItemCardSkeleton :count="6" />
        </div>

        <div v-else-if="records.length > 0" class="feed-grid">
          <ItemCard v-for="item in records" :key="item.itemId" :item="item" />
        </div>

        <EmptyState
          v-else-if="errorMessage === ''"
          :title="hasFilter ? '没有符合条件的记录' : `暂时还没有${typeMeta.label}`"
          :message="
            hasFilter
              ? '换个分类或关键词再试试，也可以直接发布一条，让信息先流动起来。'
              : '你可以成为第一个发布的人 —— 一条信息，可能正好被需要它的人看到。'
          "
        >
          <button v-if="hasFilter" type="button" class="btn btn--quiet" @click="clearFilters">
            清空筛选条件
          </button>
          <RouterLink
            v-else
            class="btn btn--primary"
            :to="{ name: 'itemPublish', query: { type: feedType } }"
          >
            {{ typeMeta.actionLabel }}
          </RouterLink>
        </EmptyState>

        <EmptyState v-else title="这次没能取到数据" :message="errorMessage">
          <button type="button" class="btn btn--primary" @click="refresh()">重新加载</button>
        </EmptyState>

        <InfiniteSentinel :disabled="isSentinelDisabled" @reach="loadNextPage" />

        <LoadMoreIndicator
          v-if="records.length > 0"
          :is-loading="isLoadingMore"
          :has-more="hasMore"
          :error-message="errorMessage"
          :empty-hint="hasFilter ? '没有更多匹配记录了' : `已浏览完全部${typeMeta.label}`"
          @retry="loadNextPage"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.feed-hero {
  padding: var(--space-16) 0 var(--space-12);
  background: var(--surface-sunken);
}

.feed-hero__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feed-hero__title {
  max-width: 20ch;
}

.feed-hero__lead {
  max-width: 46ch;
}

.feed-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.feed-hero__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-10);
  margin: var(--space-8) 0 0;
}

.feed-hero__facts dt {
  color: var(--ink-tertiary);
  font-size: 13px;
}

.feed-hero__facts dd {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 500;
}

.feed-toolbar {
  position: sticky;
  top: var(--layout-header-height);
  z-index: 20;
  padding: var(--space-5) 0;
  border-bottom: 1px solid var(--line-hairline);
  background: var(--surface-glass);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}

.feed-list {
  padding-top: var(--space-8);
}

.feed-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fill, minmax(276px, 1fr));
}

@media (max-width: 640px) {
  .feed-hero {
    padding: var(--space-10) 0 var(--space-8);
  }

  .feed-hero__facts {
    gap: var(--space-6);
  }

  .feed-toolbar {
    padding: var(--space-4) 0;
  }

  .feed-grid {
    gap: var(--space-4);
  }
}
</style>
