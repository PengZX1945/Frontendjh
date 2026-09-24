# 校园失物招领系统 README（先行开发阶段：登录与个人中心）

## 1. 项目简介

本项目旨在为校园师生提供一个高效、便捷的失物招领信息交互平台。当前处于**先行开发阶段**，核心聚焦于构建安全可靠的鉴权体系与基础的用户管理能力。

**核心技术栈：**

- **前端**：Vue 3 + Vite + TypeScript + Vue Router + Pinia + Element Plus + Axios
- **后端**：Go + Gin + GORM + MySQL 8
- **鉴权机制**：JWT（前端 localStorage 持久化 + 路由守卫）
- **部署方案**：单台云服务器 + Docker Compose（MySQL / 后端 / Nginx），支持公网访问

## 2. 项目结构

项目采用 Monorepo 架构，统一管理前后端代码与设计文档：

```
campus-lost-found/
├── web/            # 前端工程 (Vue 3)
├── server/         # 后端工程 (Go)
├── docs/           # 设计文档、接口文档
└── README.md       # 项目说明文档
```

## 3. 环境准备

在启动项目前，请确保本地开发环境满足以下要求：

- **Node.js**: >= 18.x
- **Go**: >= 1.20
- **MySQL**: 8.x
- **Docker & Docker Compose**: 用于一键部署与生产环境模拟

### 3.1 后端环境变量配置

后端服务启动前需配置 `.env` 文件（参考 `.env.example`），主要变量包括：

| 变量名 | 说明 |
|---|---|
| `DB_DSN` | MySQL 连接字符串，如 `root:password@tcp(localhost:3306)/lost_found` |
| `JWT_SECRET` | JWT 签名密钥，生产环境务必使用强随机字符串 |
| `ADMIN_INITIAL_PASSWORD` | 初始 sys_admin 账号密码（首次部署后建议修改） |
| `SERVER_PORT` | 后端服务监听端口，默认 8080 |

### 3.2 初始管理员账号

首次部署时，系统会通过 SQL 初始化脚本插入一个 sys_admin 账号：

- **用户名**：admin
- **初始密码**：由环境变量 `ADMIN_INITIAL_PASSWORD` 注入（或查看初始化脚本）
- 首次登录后请立即修改密码

## 4. 安装与运行

### 4.1 前端启动

```bash
cd web
npm install
npm run dev
```

### 4.2 后端启动

```bash
cd server
go mod tidy
go run main.go
```

### 4.3 Docker Compose 一键启动

适用于快速拉起包含 MySQL、后端与 Nginx 的完整运行环境：

```bash
docker-compose up -d
```

## 5. 功能模块说明

当前阶段系统支持三种角色：`user`（普通用户）、`finder_admin`（失物招领管理员）、`sys_admin`（系统管理员）。

### 5.1 登录注册功能

提供基础的用户准入与身份验证机制：

- **用户注册**：支持自定义用户名、昵称及联系方式，内置严格的格式校验与唯一性检查。
- **用户登录**：基于 JWT 发放凭证，支持账号状态校验（如禁用账号拦截）。
- **退出登录**：安全登出，前端同步清除本地持久化凭证。

### 5.2 个人中心功能

为已认证用户提供个人信息维护能力：

- **获取个人信息**：拉取当前登录用户的完整档案（含注册时间、角色等）。
- **修改个人信息**：支持更新昵称与联系方式。
- **修改密码**：需验证旧密码，修改成功后强制重新登录以刷新凭证。

## 6. API 接口文档

### 6.1 通用约定

- **Base URL**：`/api`
  - 注：《项目要求》文档中示例 URL 使用 `/api/v1/` 前缀，本文档统一使用 `/api` 作为 Base URL，实际接口路径为 `/api/auth/register` 等。
- **认证方式**：登录后请求头携带 `Authorization: Bearer <token>`
- **Content-Type**：`application/json`
- **统一响应结构**：`{ "code": 0, "msg": "success", "data": {} }`（code=0 表示成功，非0表示失败）

> **字段命名说明**：《项目要求》文档中注册响应使用 `name` 字段，本文档及《接口文档》统一使用 `nickname` 字段，前后端开发时请注意对齐。

### 6.2 登录注册相关接口

#### 用户注册

- **接口**：POST /auth/register（公开）
- **请求体**：

```json
{
  "username": "zhangsan",
  "password": "abc12345",
  "nickname": "张三",
  "contact": "13800001111"
}
```

- **校验规则**：username 4-32位字母数字下划线；password 8-64位。冲突返回 10005。
- **响应示例**：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "nickname": "张三",
    "role": "user"
  }
}
```

#### 用户登录

- **接口**：POST /auth/login（公开）
- **请求体**：

```json
{
  "username": "zhangsan",
  "password": "abc12345"
}
```

- **响应示例**：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "username": "zhangsan",
      "nickname": "张三",
      "role": "user",
      "contact": "13800001111"
    }
  }
}
```

- **异常说明**：登录失败返回 10006；禁用账号返回 10010。

> **字段命名说明**：《项目要求》文档中登录响应使用 `access_token` 字段名，本文档及《接口文档》统一使用 `token` 字段名。

#### 退出登录

- **接口**：POST /auth/logout（需登录）
- **响应**：data: null（前端需同步清除本地 token）

### 6.3 个人中心相关接口

#### 获取当前用户信息

- **接口**：GET /auth/profile（需登录）
- **响应示例**：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "nickname": "张三",
    "contact": "13800001111",
    "role": "user",
    "created_at": "2026-09-21 10:00:00"
  }
}
```

#### 修改个人信息

- **接口**：PUT /auth/profile（需登录）
- **请求体**：

```json
{
  "nickname": "张三丰",
  "contact": "13900002222"
}
```

#### 修改密码

- **接口**：PUT /auth/password（需登录）
- **请求体**：

```json
{
  "old_password": "abc12345",
  "new_password": "newpass88"
}
```

- **异常说明**：旧密码错误返回 10006；成功后前端应引导用户重新登录。

## 7. 错误码说明

| code | msg | 说明 |
|---|---|---|
| 0 | success | 成功 |
| 10001 | 参数错误 | 请求参数缺失或格式不合法 |
| 10002 | 未登录或登录已过期 | token 缺失/非法/过期，前端应跳登录页 |
| 10003 | 无权限操作 | 角色不满足接口要求 |
| 10004 | 资源不存在 | 帖子/用户/公告等不存在 |
| 10005 | 用户名已存在 | 注册冲突 |
| 10006 | 用户名或密码错误 | 登录失败或旧密码错误 |
| 10007 | 当前状态不允许该操作 | 如重复审核、修改他人帖子 |
| 10008 | 文件上传失败 | 格式不支持或超过大小限制 |
| 10009 | 请勿重复提交 | 如重复认领同一帖子 |
| 10010 | 账号已被禁用 | 登录时被禁用的账号 |
| 20001 | 服务器内部错误 | 未预期异常 |

**分页约定**：请求参数 page（从1开始，默认1）、page_size（默认12，最大50）；响应 data 包含 list, total, page, page_size。

```json
{ "list": [], "total": 100, "page": 1, "page_size": 12 }
```

## 8. 开发规范

### 8.1 命名规范

- **前端**：组件名采用 kebab-case（烤串式命名法），变量名采用 camelCase（小驼峰）。
- **后端**：组件名采用 CamelCase（大驼峰）。

### 8.2 Git 分支模型

- **main**：受保护分支，仅接受 PR 合并。
- **develop**：日常集成分支。
- **功能分支**：feature/web-xxx、feature/server-xxx。
- **修复分支**：fix/xxx。

### 8.3 Commit 规范

严格遵循 Conventional Commits 规范：`type(scope): 描述`

常用 type：feat / fix / docs / style / refactor / test / chore

示例：

- `feat(server): 发布信息审核接口`
- `feat(web): 失物招领列表页与筛选栏`
- `fix(server): 修复重复认领约束`
- `docs: 更新接口文档`

## 9. 后续开发计划

| 阶段 | 内容 | 产出 |
|---|---|---|
| 第 1 周 | 仓库初始化、数据库建表、前后端脚手架、登录注册联调 | 可登录的骨架系统 |
| 第 2 周 | 发布/列表/详情/筛选搜索、图片上传、个人中心 | 核心功能可用 |
| 第 3 周 | 审核流、认领流、公告、系统管理、统计 | 全部功能完成 |
| 第 4 周 | 联调修 bug、Docker 部署上云、验收演示 | 公网可访问 |

**分工建议：**

- **后端 A**：用户/鉴权/发布模块；**后端 B**：审核/认领/公告/统计模块。
- **前端 A**：列表/详情/发布/个人中心；**前端 B**：登录注册/审核后台/系统管理/统计图表。

> **注**：接口以《接口文档.md》为契约，前后端可并行开发（前端可先使用 mock 数据）。

## 附录：文档差异说明

由于本项目参考了多份文档，以下字段/路径差异已在实现中统一：

| 差异项 | 《项目要求》 | 《接口文档》 | 本文档采用 |
|---|---|---|---|
| Base URL 前缀 | `/api/v1/` | `/api` | `/api` |
| 登录响应 token 字段名 | `access_token` | `token` | `token` |
| 注册响应用户名字段 | `name` | `nickname` | `nickname` |
| 注册响应角色值 | `student` | `user` | `user` |
