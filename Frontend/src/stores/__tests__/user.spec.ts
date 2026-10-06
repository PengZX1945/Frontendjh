import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../user'

// 必须在 ./user 被 import 之前准备好 storage（store 模块加载时就会读取）
const env = vi.hoisted(() => {
  const make = () => {
    const map = new Map<string, string>()
    return {
      getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
      setItem: (key: string, value: string) => {
        map.set(key, String(value))
      },
      removeItem: (key: string) => {
        map.delete(key)
      },
      clear: () => {
        map.clear()
      },
    }
  }
  const local = make()
  const session = make()
  Object.defineProperty(globalThis, 'localStorage', {
    value: local,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: session,
    configurable: true,
    writable: true,
  })
  return { local, session }
})

describe('user store persistence', () => {
  beforeEach(() => {
    env.local.clear()
    env.session.clear()
    setActivePinia(createPinia())
  })

  it('keeps login in localStorage when remember is true', () => {
    const store = useUserStore()
    store.setAuth({ token: 't1', username: 'alice', remember: true })

    expect(store.isLoggedIn).toBe(true)
    expect(env.local.getItem('token')).toBe('t1')
    expect(env.local.getItem('current_user')).toBe('alice')
    expect(env.local.getItem('login_user')).toBe('alice')
    expect(env.session.getItem('token')).toBeNull()

    // 模拟刷新页面：新 store 实例应从 storage 恢复登录态
    setActivePinia(createPinia())
    const restored = useUserStore()
    expect(restored.isLoggedIn).toBe(true)
    expect(restored.username).toBe('alice')
  })

  it('keeps login in sessionStorage when remember is false', () => {
    const store = useUserStore()
    store.setAuth({ token: 't2', username: 'bob', remember: false })

    expect(env.session.getItem('token')).toBe('t2')
    expect(env.session.getItem('current_user')).toBe('bob')
    expect(env.local.getItem('token')).toBeNull()
    expect(env.local.getItem('login_user')).toBeNull()

    setActivePinia(createPinia())
    const restored = useUserStore()
    expect(restored.isLoggedIn).toBe(true)
    expect(restored.username).toBe('bob')
  })

  it('clears credentials on logout but keeps the remembered username', () => {
    const store = useUserStore()
    store.setAuth({ token: 't3', username: 'carol', remember: true })

    store.logout()

    expect(store.isLoggedIn).toBe(false)
    expect(store.username).toBe('')
    expect(env.local.getItem('token')).toBeNull()
    expect(env.session.getItem('token')).toBeNull()
    expect(env.local.getItem('current_user')).toBeNull()
    expect(store.getRememberedUsername()).toBe('carol')
  })

  it('persists the admin role and restores it on refresh', () => {
    const store = useUserStore()
    store.setAuth({ token: 't4', username: 'admin', remember: false, role: 'admin' })

    expect(store.role).toBe('admin')
    expect(store.isAdmin).toBe(true)
    expect(env.session.getItem('role')).toBe('admin')
    expect(env.local.getItem('role')).toBeNull()

    // 模拟刷新页面：角色应同样从 storage 恢复
    setActivePinia(createPinia())
    const restored = useUserStore()
    expect(restored.role).toBe('admin')
    expect(restored.isAdmin).toBe(true)

    // 退出登录后回到普通用户，storage 里的角色也清掉
    restored.logout()
    expect(restored.role).toBe('user')
    expect(restored.isAdmin).toBe(false)
    expect(env.session.getItem('role')).toBeNull()
  })

  it('falls back to the normal user role when role is missing or unknown', () => {
    const store = useUserStore()
    store.setAuth({ token: 't5', username: 'dave', remember: true })

    expect(store.role).toBe('user')
    expect(store.isAdmin).toBe(false)
    expect(env.local.getItem('role')).toBe('user')

    store.setAuth({ token: 't6', username: 'dave', remember: true, role: undefined })
    expect(store.role).toBe('user')
  })
})
