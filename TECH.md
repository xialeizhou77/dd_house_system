# 大地集团智能选房系统 - 技术文档

本文档描述项目的技术栈、架构设计与实现细节，供开发与 AI 助手快速了解项目。

---

## 一、项目概述

**大地集团智能选房系统** 是一个前后端分离的智能选房管理系统，面向安置房选房业务，支持：

- 用户登录认证
- 选房管理（第一轮/第二轮）
- 楼栋航拍图选房
- 航拍图楼栋坐标标注
- 选房统计 Dashboard

---

## 二、技术栈

### 2.1 前端

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | React | 18.2 | 函数组件 + Hooks |
| 构建 | Vite | 5.x | 开发服务器、代理、构建 |
| 路由 | react-router-dom | 6.20 | 嵌套路由、Protected Route |
| HTTP | axios | 1.6 | 封装 api、拦截器 |
| 图表 | echarts / echarts-for-react | 6.x / 3.x | Dashboard 图表 |
| 动画 | framer-motion | 12.x | 页面/组件动效 |
| 样式 | Tailwind CSS | 4.x | 原子化 CSS |
| 字体 | @fontsource | 5.x | Inter、Noto Sans SC、Playfair Display |

### 2.2 后端

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行时 | Node.js | - | ES Module (type: "module") |
| 框架 | Express | 4.18 | REST API |
| 认证 | jsonwebtoken | 9.x | JWT 签发与校验 |
| 密码 | bcryptjs | 2.4 | 密码哈希 |
| CORS | cors | 2.8 | 跨域配置 |

### 2.3 开发与部署工具

| 工具 | 用途 |
|------|------|
| concurrently | 同时启动前后端 |
| node --watch | 后端热重载 |

---

## 三、项目结构

```
houseSystem/
├── client/                      # 前端 React SPA
│   ├── index.html
│   ├── vite.config.js           # /api 代理到 3001
│   ├── tailwind.config.js       # 主题色、字体、动画
│   ├── postcss.config.js
│   ├── public/
│   │   ├── aerial-bg.png        # 航拍底图
│   │   ├── home-bg.png
│   │   └── floorplans/          # 户型图 80/90/100/120m2.png
│   └── src/
│       ├── main.jsx             # 入口、Provider 挂载
│       ├── App.jsx              # 路由定义
│       ├── index.css            # 全局样式
│       ├── api/
│       │   └── client.js        # axios 实例、请求/响应拦截器
│       ├── contexts/
│       │   ├── AuthContext.jsx
│       │   ├── SelectionDataContext.jsx
│       │   └── SelectionTimerContext.jsx
│       ├── components/
│       │   ├── Icons.jsx
│       │   ├── DashboardCharts.jsx
│       │   └── GlobalSelectionTimerBar.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Home.jsx
│       │   ├── HouseSelection.jsx
│       │   ├── SelectionManage.jsx
│       │   ├── StartSelection.jsx
│       │   ├── BuildingPage.jsx
│       │   ├── UnselectedList.jsx
│       │   ├── AllList.jsx
│       │   └── AnnotatePage.jsx
│       ├── mock/
│       │   └── selectionData.js  # 选房记录 mock
│       └── styles/
│           └── AerialMap.css
├── server/
│   ├── index.js                 # Express 入口、mock 数据挂载
│   ├── middleware/
│   │   └── auth.js              # JWT 校验中间件
│   ├── routes/
│   │   ├── auth.js
│   │   ├── house.js
│   │   ├── stats.js
│   │   └── coords.js
│   └── data/
│       └── buildingCoords.json  # 楼栋坐标持久化
├── package.json                 # 根脚本
├── DEPLOY.md
├── ruler.md                     # 需求说明
└── TECH.md                      # 本文档
```

---

## 四、认证与授权

### 4.1 登录流程

1. `POST /api/auth/login` 提交 `username`、`password`
2. 后端 bcrypt 校验，成功签发 JWT（有效期 24h）
3. 返回 `{ token, user: { id, username, name } }`
4. 前端存储到 `localStorage`，并更新 `AuthContext`

### 4.2 请求携带 Token

- axios 拦截器从 `localStorage.getItem('token')` 读取
- 请求头：`Authorization: Bearer <token>`
- 401 响应时清除 token、跳转 `/login`

### 4.3 路由保护

- `ProtectedRoute` 包裹需登录页面
- 无 token 时 `<Navigate to="/login" replace />`

### 4.4 测试账号

| 用户名 | 密码 |
|--------|------|
| admin | 123456 |
| user1 | 123456 |

---

## 五、API 设计

### 5.1 认证

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | ❌ | 登录 |

### 5.2 选房业务 (`/api/house`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/person/:code` | 按编号查询选房人（支持 id、orderNo、idNumber、phone） |
| GET | `/persons/unselected` | 未选房人列表 |
| GET | `/persons/all` | 全部选房人列表 |
| GET | `/houses/available` | 可选房源列表 |
| GET | `/houses/all` | 全部房源列表 |
| POST | `/select` | 执行选房 `{ personId, houseId }` |

### 5.3 统计 (`/api/stats`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 返回 `date`、`todaySelected`、`pendingDelivery`、`totalSelected`、`totalHouses` |

### 5.4 楼栋坐标 (`/api/building-coords`)

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/` | ❌ | 获取楼栋坐标列表 |
| POST | `/` | ❌ | 保存楼栋坐标数组，持久化到 JSON |

**坐标项结构**：`{ id, label, zone, top?, left? }`，`top`/`left` 为百分比字符串。

---

## 六、路由与页面

### 6.1 路由树

```
/login                           # 登录页
/                                # 首页布局（需登录）
├── (index)                      # Dashboard
├── /annotate                    # 航拍图楼栋标注
└── /house-selection             # 选房模块（SelectionDataProvider）
    ├── /manage                  # 选房管理
    ├── /round1/start            # 第一轮-开始选房
    ├── /round1/building         # 第一轮-楼栋选房
    ├── /round1/unselected       # 第一轮-未选房列表
    ├── /round1/all              # 第一轮-全部列表
    ├── /round2/start            # 第二轮-开始选房
    ├── /round2/building         # 第二轮-楼栋选房
    ├── /round2/unselected       # 第二轮-未选房列表
    └── /round2/all              # 第二轮-全部列表
```

### 6.2 页面职责

| 页面 | 职责 |
|------|------|
| Login | 用户名密码登录 |
| Home | 顶部标题、菜单、Dashboard |
| AnnotatePage | 航拍图上标注楼栋坐标 |
| HouseSelection | 选房侧边菜单 + `<Outlet>` |
| SelectionManage | 选房管理表格 |
| StartSelection | 输入编号查询 → 弹窗确认 → 开始选房 |
| BuildingPage | 航拍图选楼栋 → 楼层户型选房 → 确认 |
| UnselectedList | 未选房人列表 |
| AllList | 全部选房人列表 |

---

## 七、状态管理（Context）

### 7.1 AuthContext

| 状态/方法 | 说明 |
|-----------|------|
| `token` | JWT |
| `user` | `{ id, username, name }` |
| `login(token, user)` | 登录成功后调用 |
| `logout()` | 登出 |

### 7.2 SelectionDataContext

| 状态/方法 | 说明 |
|-----------|------|
| `rows` | 选房记录数组（含 firstRound、secondRound、已选区、已选楼号等） |
| `setRows` | 更新选房记录 |

数据来源：`mock/selectionData.js`，按村、日期生成 mock 记录。

### 7.3 SelectionTimerContext

| 状态/方法 | 说明 |
|-----------|------|
| `status` | `idle` \| `running` \| `locked` \| `finished` |
| `remainingMs` | 剩余毫秒 |
| `progress` | 0–100 进度 |
| `isLocked` | 是否超时锁定 |
| `startTimer()` | 启动 3 分钟倒计时 |
| `finishTimer()` | 选房确认后结束 |
| `resetTimer()` | 重置 |

---

## 八、楼栋选房流程（BuildingPage）

### 8.1 数据流

1. 从 `SelectionDataContext` 的 `rows` 计算各楼栋已选数量
2. 从 `GET /api/building-coords` 获取楼栋在航拍图上的坐标
3. 合并为带热力色彩的楼栋列表，展示在航拍图上
4. 点击楼栋进入楼层户型选择
5. 选房后更新 `rows`，并调用 `finishTimer()`

### 8.2 楼栋 ID 规则

| 格式 | 示例 | 说明 |
|------|------|------|
| `西区_x` | `西区_1` | 西区 x 号楼 |
| `东区_x` | `东区_2` | 东区 x 号楼 |
| `w-x` | `w-1` | 西区 x 号楼 |
| `e-x` | `e-2` | 东区 x 号楼 |

### 8.3 楼层户型 Mock

- 11 层 × 2 单元 × 东西户 = 44 户/栋
- 每户：`code`、`size`、`status`（`available` / `sold`）、`unit`
- 状态由 `hash % 3` 决定（mock 逻辑）

### 8.4 户型图

| 面积 | 图片路径 |
|------|----------|
| 80㎡ | `/floorplans/80m2.png` |
| 100㎡ | `/floorplans/100m2.png` |
| 120㎡ | `/floorplans/120m2.png` |

---

## 九、航拍标注（AnnotatePage）

- 使用 `aerial-bg.png` 作为底图
- 点击地图记录点击位置百分比坐标
- 支持选择西区/东区、输入楼号
- 坐标保存到 `POST /api/building-coords`，写入 `server/data/buildingCoords.json`

---

## 十、样式与主题

### 10.1 Tailwind 主题色

| 名称 | 用途 |
|------|------|
| `primary` | 主色（#1B263B 深蓝） |
| `secondary` | 辅色（#C5A059 金棕） |
| `status.available` | 可选 |
| `status.reserved` | 预留 |
| `status.sold` | 已售 |

### 10.2 字体

- 标题：Playfair Display
- 正文：Inter Variable、Noto Sans SC Variable

### 10.3 动画

- `float`：上下浮动
- `fadeIn`：淡入

---

## 十一、开发与部署

### 11.1 本地开发

```bash
npm run install:all   # 安装根 + server + client 依赖
npm run dev           # 同时启动 server(3001) 与 client(5173)
```

- 前端：http://localhost:5173
- 后端：http://localhost:3001
- Vite 将 `/api` 代理到后端

### 11.2 生产构建

```bash
npm run build         # 构建 client/dist
npm start             # NODE_ENV=production node server/index.js
```

- 生产环境：Express 托管 `client/dist`，SPA 路由回退到 `index.html`

### 11.3 环境变量

| 变量 | 说明 |
|------|------|
| `PORT` | 服务端口，默认 3001 |
| `JWT_SECRET` | JWT 密钥，默认 `house-system-secret-key-2024` |
| `NODE_ENV` | `production` 时启用静态托管 |

---

## 十二、数据与持久化

| 数据类型 | 存储位置 | 持久化 |
|----------|----------|--------|
| 用户 | `server/index.js` 内存 | ❌ 重启丢失 |
| 选房人/房源 | `server/index.js` mockData | ❌ 内存 |
| 楼栋坐标 | `server/data/buildingCoords.json` | ✅ 文件 |
| 选房记录（前端） | `SelectionDataContext` + mock | ❌ 刷新丢失 |

---

## 十三、注意事项

1. **Mock 数据**：选房业务主要使用 mock，未接入真实数据库
2. **楼栋坐标 API**：未加 JWT，目前任何人可读写
3. **销控管理**：菜单有入口，功能待完善
4. **选房记录**：前端 `rows` 与后端 `/api/house/select` 未完全打通

---

*文档生成日期：2025-02-13*
