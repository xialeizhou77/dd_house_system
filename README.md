# 大地集团智能选房系统

前后端分离的智能选房管理系统。

## 功能模块

### 登录页面
- 左右布局（左 1/3：登录表单，右 2/3：系统标题与版本信息）
- 支持用户名、密码登录

### 首页
- 顶部标题栏：大地集团xx项目智能选房系统
- 菜单栏：智能选房、销控管理
- Dashboard：当前日期、当日选房、待交付总套数、累计选房

### 智能选房
- 左侧树状菜单：选房管理 > 第一轮/第二轮选房 > 开始选房、未选房列表、全部列表
- 【开始选房】：输入编号查询 → 弹窗展示选房人信息 → 选择房源 → 开始选房/重新查询

## 技术栈

- **前端**：React 18 + Vite + React Router
- **后端**：Node.js + Express
- **认证**：JWT

## 快速开始

### 安装依赖

```bash
npm run install:all
```

### 启动开发环境

```bash
npm run dev
```

将同时启动：
- 后端 API：http://localhost:3001
- 前端应用：http://localhost:5173

### 测试账号

- 用户名：`admin`
- 密码：`123456`

## 项目结构

```
houseSystem/
├── client/          # 前端 React 应用
│   ├── src/
│   │   ├── api/     # API 请求
│   │   ├── contexts/
│   │   └── pages/
│   └── ...
├── server/          # 后端 Express API
│   ├── middleware/
│   ├── routes/
│   └── index.js
└── ruler.md         # 需求说明
```
# dd_house_system
