import { test, expect } from '@playwright/test'

/**
 * 端到端冒烟：不依赖后端也能跑的「外壳 + 信息流骨架」检查。
 * 需要连数据时先起 mock：MOCK_PORT=8090 npm run mock:api，
 * 再 VITE_API_TARGET=http://localhost:8090 npm run dev。
 */
test('首页渲染信息流骨架（无需后端）', async ({ page }) => {
  await page.goto('/')

  // 顶栏品牌与频道导航
  await expect(page.getByText('校园失物招领').first()).toBeVisible()
  await expect(page.getByRole('link', { name: '寻物启事' }).first()).toBeVisible()

  // 重定向到寻物启事频道，hero 标题在位
  await expect(page).toHaveURL(/\/feed\/lost/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('丢了东西')
})
