import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showErrorToast } from '@/composables/use-toast'

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录才能访问 */
    requiresAuth?: boolean
    /** 已登录用户不应再访问（登录、注册页） */
    requiresGuest?: boolean
    /** 需要 finder_admin 及以上（审核台、认领审批） */
    requiresBackOffice?: boolean
    /** 需要 sys_admin（公告管理、用户管理、全校总览） */
    requiresSystemAdmin?: boolean
    /** 浏览器标签页标题 */
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'itemFeed', params: { type: 'lost' } },
  },
  {
    // 信息流：寻物启事 / 失物招领共用同一页面，靠路由参数区分
    path: '/feed/:type(lost|found)',
    name: 'itemFeed',
    component: () => import('@/views/item-feed-view.vue'),
    meta: { title: '浏览流' },
  },
  {
    path: '/items/:itemId(\\d+)',
    name: 'itemDetail',
    component: () => import('@/views/item-detail-view.vue'),
    meta: { title: '物品详情' },
  },
  {
    path: '/publish',
    name: 'itemPublish',
    component: () => import('@/views/item-publish-view.vue'),
    meta: { requiresAuth: true, title: '发布信息' },
  },
  {
    path: '/items/:itemId(\\d+)/edit',
    name: 'itemEdit',
    component: () => import('@/views/item-edit-view.vue'),
    meta: { requiresAuth: true, title: '修改信息' },
  },
  {
    path: '/me/items',
    name: 'myItems',
    component: () => import('@/views/my-items-view.vue'),
    meta: { requiresAuth: true, title: '我的发布' },
  },
  {
    path: '/me/claims',
    name: 'myClaims',
    component: () => import('@/views/my-claims-view.vue'),
    meta: { requiresAuth: true, title: '我的认领' },
  },
  {
    path: '/me/claims/:claimId(\\d+)',
    name: 'claimDetail',
    component: () => import('@/views/claim-detail-view.vue'),
    meta: { requiresAuth: true, title: '申请详情' },
  },
  {
    path: '/announcements',
    name: 'announcementList',
    component: () => import('@/views/announcement-list-view.vue'),
    meta: { title: '公告' },
  },
  {
    path: '/announcements/:announcementId(\\d+)',
    name: 'announcementDetail',
    component: () => import('@/views/announcement-detail-view.vue'),
    meta: { title: '公告详情' },
  },
  {
    path: '/login',
    name: 'userLogin',
    component: () => import('@/views/user-login-view.vue'),
    meta: { requiresGuest: true, title: '登录' },
  },
  {
    path: '/register',
    name: 'userRegister',
    component: () => import('@/views/user-register-view.vue'),
    meta: { requiresGuest: true, title: '注册' },
  },
  {
    path: '/profile',
    name: 'userProfile',
    component: () => import('@/views/user-profile-view.vue'),
    meta: { requiresAuth: true, title: '个人中心' },
  },
  {
    path: '/admin/review',
    name: 'adminReview',
    component: () => import('@/views/admin-review-view.vue'),
    meta: { requiresBackOffice: true, title: '发布审核' },
  },
  {
    path: '/admin/claims',
    name: 'adminClaims',
    component: () => import('@/views/admin-claims-view.vue'),
    meta: { requiresBackOffice: true, title: '认领审批' },
  },
  {
    path: '/admin/items',
    name: 'adminItems',
    component: () => import('@/views/admin-items-view.vue'),
    meta: { requiresSystemAdmin: true, title: '全校总览' },
  },
  {
    path: '/admin/announcements',
    name: 'adminAnnouncements',
    component: () => import('@/views/admin-announcement-view.vue'),
    meta: { requiresSystemAdmin: true, title: '公告管理' },
  },
  {
    path: '/admin/users',
    name: 'adminUsers',
    component: () => import('@/views/admin-users-view.vue'),
    meta: { requiresSystemAdmin: true, title: '用户管理' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/not-found-view.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 浏览器前进后退还原位置；其余情况回到顶部
    if (savedPosition) return savedPosition
    if (to.hash !== '') return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (
    (to.meta.requiresAuth || to.meta.requiresBackOffice || to.meta.requiresSystemAdmin) &&
    !userStore.isLoggedIn
  ) {
    // 记下目标地址，登录成功后原路返回
    return { name: 'userLogin', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresBackOffice && !userStore.isBackOffice) {
    showErrorToast('当前账号无权访问审核台')
    return { name: 'itemFeed', params: { type: 'lost' } }
  }

  if (to.meta.requiresSystemAdmin && !userStore.isSystemAdmin) {
    showErrorToast('当前账号无权访问系统管理')
    return { name: 'itemFeed', params: { type: 'lost' } }
  }

  if (to.meta.requiresGuest && userStore.isLoggedIn) {
    return { name: 'userProfile' }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · 校园失物招领系统` : '校园失物招领系统'
})

export default router
