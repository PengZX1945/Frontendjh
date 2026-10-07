import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import App from '../App.vue'
import router from '../router'

/**
 * 外壳冒烟：确认顶栏品牌、频道导航与页脚能正常挂载。
 * 这里 stub 掉 RouterView，避免顺带触发页面的接口请求 —— 页面级行为由 e2e 覆盖。
 */
describe('App', () => {
  it('渲染应用外壳：品牌与导航入口', async () => {
    // 路由守卫里会取用会话 store，因此要先让 pinia 生效再触发导航
    const pinia = createPinia()
    setActivePinia(pinia)

    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
        stubs: { RouterView: true },
      },
    })

    const text = wrapper.text()
    expect(text).toContain('校园失物招领')
    expect(text).toContain('寻物启事')
    expect(text).toContain('失物招领')
    expect(text).toContain('公告')
    expect(text).toContain('发布信息')
  })
})
