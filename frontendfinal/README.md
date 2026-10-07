# 校园失物招领系统 · 前端

精弘大作业「校园失物招领系统」的前端工程。Vue 3 + TypeScript + Vue Router + Pinia + Axios，覆盖用户、物品、认领申请、发布审核、公告、系统管理六个接口分组。

## 快速开始

```bash
npm install

# 联调（本地 mock 后端在 8090；本机 8080 常被其他服务占用）
MOCK_PORT=8090 npm run mock:api
VITE_API_TARGET=http://localhost:8090 npm run dev     # http://localhost:5173
```

对接真实后端时只需换环境变量，代码不用改：

```bash
VITE_API_TARGET=http://<后端地址>:8080 npm run dev
```

mock 账号：`student001 / abc123`（普通用户）、`finder001 / abc123`（失物招领管理员）、`admin / admin123`（系统管理员）。

## 脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器（`/api` 代理到 `VITE_API_TARGET`，默认 `http://localhost:8080`） |
| `npm run mock:api` | 本地 mock 后端（`MOCK_PORT` 可改端口） |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run type-check` | `vue-tsc --build` |
| `npm run test:unit` | Vitest 单元测试 |
| `npm run test:e2e` | Playwright 端到端（首次需 `npx playwright install`） |
| `npm run lint` / `npm run format` | oxlint + eslint / prettier |

## 文档

- [`docs/前端说明.md`](docs/前端说明.md) —— 接口对照、目录职责、命名约定、设计系统取舍、后端契约中的不确定点、验证记录。

## 目录速览

```
src/
├── api/          唯一 axios 实例 + 各接口分组
├── components/   界面组件（kebab-case 命名）
├── composables/  分页取数、轻提示、确认框、无限滚动哨兵
├── constants/    分类 / 状态 / 角色 / 表单限制
├── router/       路由表与守卫
├── stores/       会话 store（凭证与档案）
├── styles/       设计令牌 + 基础层（手写界面原语）
├── types/        接口信封与各领域模型
├── utils/        归一化、校验、日期、错误文案
└── views/        页面
mock/             本地联调用的 mock 后端
```
