/// <reference types="vite/client" />

declare module '*.js';

// App.vue 等 SFC 的 <script setup> 未使用 lang="ts" 时，
// vue-tsc 无法推导其导出类型，这里补一个兜底声明。
declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
    export default component;
}
