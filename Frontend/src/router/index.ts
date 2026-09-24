import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

declare module 'vue-router' {
  interface RouteMeta {
    /** 需要登录才能访问 */
    requiresAuth?: boolean
    /** 已登录用户不应再访问（登录、注册页） */
    requiresGuest?: boolean
    /** 浏览器标签页标题 */
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'userProfile' },
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
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    redirect: { name: 'userProfile' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 记下目标地址，登录成功后原路返回
    return { name: 'userLogin', query: { redirect: to.fullPath } }
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
