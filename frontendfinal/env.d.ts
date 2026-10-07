/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 接口根地址（含 /api 前缀）。留空则走同源 /api，由 Vite 代理或 Nginx 转发 */
  readonly VITE_API_BASE?: string
  /** 开发态代理目标，仅供 vite.config.ts 使用 */
  readonly VITE_API_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
