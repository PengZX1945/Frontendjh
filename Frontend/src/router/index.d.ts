/**
 * router/index.js 是 JS 文件，这里补充类型声明，
 * 修复 main.ts 的 TS7016：「找不到模块 ./router 的声明文件」。
 */
import type { Router } from 'vue-router'

/** 具名导出：api/request.js 的 401 处理需要用它做跳转 */
export declare const router: Router

declare const _default: Router
export default _default
