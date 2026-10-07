import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

/**
 * 后端默认地址：与后端 `SERVER_PORT` 的默认值 8080 对齐。
 * 本地 mock、队友的后端、远端测试服都只需覆盖 `VITE_API_TARGET`，不必改代码：
 *   VITE_API_TARGET=http://localhost:8090 npm run dev
 *
 * 这里刻意保持「对象式」配置（而非 `defineConfig(({ mode }) => ...)` 的函数式），
 * 因为 `vitest.config.ts` 用 `mergeConfig(viteConfig, ...)` 合并本文件，
 * 函数式配置需要先求值再合并，徒增一处易错点。
 */
const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8080'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // 开发态前后端同源，规避 CORS；生产态由 Nginx 反向代理 /api
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
