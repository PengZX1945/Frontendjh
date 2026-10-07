import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 弹窗右上角锚点：紧贴触发按钮下方 */
export interface AuthPos {
  top: number
  right: number
}

/** 登录 / 注册二级弹窗的全局状态：NavBar 等处打开，AuthDialog 渲染 */
export const useAuthStore = defineStore('auth', () => {
  const visible = ref(false)
  const tab = ref<'login' | 'register'>('login')
  /** 登录成功后的跳转目标 */
  const redirect = ref('/home')
  /** 弹窗锚点（右上角紧贴按钮下方），未传时回退到默认右上角 */
  const pos = ref<AuthPos>({ top: 84, right: 24 })

  function openAuth(target: 'login' | 'register', dest = '/home', anchor?: AuthPos): void {
    tab.value = target
    redirect.value = dest
    if (anchor) pos.value = anchor
    visible.value = true
  }
  function closeAuth(): void {
    visible.value = false
  }

  return { visible, tab, redirect, pos, openAuth, closeAuth }
})
