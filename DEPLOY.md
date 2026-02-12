# 部署到远程服务器

## 一、部署方式概览

- **推荐**：在服务器上构建前端，由 Node 进程同时提供 API 和静态资源（单端口、同源）。
- **可选**：用 Nginx 做反向代理（同一域名下转发 `/api` 到后端、其余走静态或前端构建）。

前端请求使用相对路径 `/api`，与后端同域时无需改前端代码。

---

## 二、单机部署（Node 托管前端）

### 1. 环境要求

- Node.js 18+（建议 LTS）
- 服务器开放一个端口（如 3001 或 80）

### 2. 在服务器上安装 Node.js

**Ubuntu / Debian：**

```bash
# 使用 NodeSource 安装 LTS（以 20.x 为例）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v   # 应 >= 18
npm -v
```

**CentOS / RHEL / Rocky / Alma：**

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

node -v
npm -v
```

**其他方式（任意 Linux）：**

- 从 [nodejs.org](https://nodejs.org/) 下载二进制包，解压到 `/usr/local` 或 `~/node`，并把 `bin` 加入 `PATH`。
- 或用 [nvm](https://github.com/nvm-sh/nvm)：`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`，然后 `nvm install 20`。

### 3. 上传代码

将项目上传到服务器（如 `/opt/houseSystem`），或使用 Git：

```bash
git clone <你的仓库地址> /opt/houseSystem
cd /opt/houseSystem
```

### 4. 安装项目依赖并构建

```bash
# 安装根目录、服务端、前端依赖
npm run install:all

# 构建前端（输出到 client/dist）
npm run build
```

### 5. 启动生产服务

**Linux / macOS：**

```bash
export NODE_ENV=production
export PORT=3001
npm run start
```

或一行：

```bash
NODE_ENV=production PORT=3001 npm run start
```

**Windows（PowerShell）：**

```powershell
$env:NODE_ENV="production"; $env:PORT="3001"; node server/index.js
```

服务会在 `http://0.0.0.0:3001` 监听，页面和接口均为同一端口。

### 6. 环境变量（可选）

| 变量 | 说明 | 默认 |
|------|------|------|
| `NODE_ENV` | 设为 `production` 时启用静态托管与 SPA 回退 | 未设置（开发） |
| `PORT` | 服务监听端口 | 3001 |
| `JWT_SECRET` | JWT 密钥，生产环境务必修改 | 开发用默认值 |

示例：

```bash
export JWT_SECRET=你的随机长字符串
NODE_ENV=production PORT=80 npm run start
```

### 7. 使用 PM2 常驻运行（推荐）

```bash
npm install -g pm2
cd /opt/houseSystem
NODE_ENV=production PORT=3001 pm2 start server/index.js --name house-system
pm2 save
pm2 startup
```

查看日志：`pm2 logs house-system`

---

## 三、使用 Nginx 反向代理（可选）

若希望用 80/443 或与其它站点共存，可用 Nginx 做反向代理，Node 只跑 API（或同时托管前端）。

---

### CentOS 上安装 Nginx 并配置反向代理（完整步骤）

#### 1. 安装 Nginx

**CentOS 7：**

```bash
sudo yum install -y epel-release
sudo yum install -y nginx
```

**CentOS 8 / Rocky Linux / AlmaLinux：**

```bash
sudo dnf install -y nginx
# 或
sudo yum install -y nginx
```

#### 2. 放行防火墙（若使用 firewalld）

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 3. 启动并设置开机自启

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

#### 4. 新建站点配置（反向代理到 Node）

本系统由 Node 在 3001 端口同时提供页面和 API，推荐 Nginx 只做「全站转发」到 3001。

```bash
sudo vi /etc/nginx/conf.d/houseSystem.conf
```

写入（将 `your-domain.com` 改为你的域名或服务器 IP）：

```nginx
server {
    listen 80;
    server_name your-domain.com;   # 或填服务器公网 IP，如 47.96.xxx.xxx

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

保存退出（`:wq`）。

#### 5. 检查配置并重载 Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. 确保 Node 服务在运行

Nginx 只转发请求，应用需常驻。建议用 PM2：

```bash
cd /home/dadi/houseSystem
NODE_ENV=production PORT=3001 pm2 start server/index.js --name house-system
pm2 save
pm2 startup
```

完成后访问 `http://your-domain.com` 或 `http://服务器IP` 即可（无需带端口）。

#### 7. 可选：HTTPS（Let’s Encrypt）

若已绑定域名，可安装 certbot 申请免费证书：

```bash
# CentOS 7
sudo yum install -y certbot python3-certbot-nginx

# CentOS 8 / Rocky / Alma
sudo dnf install -y certbot python3-certbot-nginx

# 申请证书并自动改 Nginx 配置（按提示选域名）
sudo certbot --nginx -d your-domain.com
```

证书到期前 certbot 会自动续期。

#### 8. 常用命令

```bash
sudo nginx -t          # 检查配置
sudo systemctl reload nginx   # 重载配置
sudo systemctl restart nginx  # 重启
sudo systemctl status nginx   # 状态
```

---

### 1. 仅代理 API，静态仍由 Node 提供

Node 仍按上面方式以生产模式启动（例如端口 3001），Nginx 只做端口转发：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Nginx 托管静态、仅代理 /api

前端构建产物放到 Nginx 目录，API 转发到 Node：

```bash
# 构建后复制到 Nginx 目录
npm run build
cp -r client/dist/* /var/www/houseSystem/
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/houseSystem;
    index index.html;
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Node 只跑 API（不托管静态），启动时可不设 `NODE_ENV=production`，或单独起一个只提供 API 的进程。

---

## 四、数据与安全

- **楼栋坐标**：保存在 `server/data/buildingCoords.json`，部署后请保证该目录可写，并定期备份。
- **生产环境**：务必设置强 `JWT_SECRET`，并修改默认管理员密码。
- **HTTPS**：对外服务建议在 Nginx 或负载均衡层配置 SSL（如 Let’s Encrypt）。

---

## 五、常用命令速查

```bash
# 安装依赖
npm run install:all

# 构建前端
npm run build

# 生产启动（Linux/macOS）
NODE_ENV=production PORT=3001 npm run start

# PM2 启动
NODE_ENV=production PORT=3001 pm2 start server/index.js --name house-system
```
