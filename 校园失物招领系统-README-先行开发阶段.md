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

### 参见 https://github.com/PengZX1945/Frontendjh/edit/PengZX1945-midtest/精弘大作业（失物招领系统）接口文档.md
