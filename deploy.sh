#!/bin/sh
# 智能选房系统 - 完整部署/重启脚本
# 用法：sh deploy.sh  或  ./deploy.sh

set -e

# ========== 可配置项 ==========
PROJECT_DIR="${PROJECT_DIR:-dd_house_system}"   # 项目目录，可改为绝对路径如 /opt/houseSystem
APP_NAME="house-system"
PORT="${PORT:-3001}"

# ========== 执行 ==========
cd "$PROJECT_DIR" || { echo "错误: 无法进入目录 $PROJECT_DIR"; exit 1; }

echo ">>> 安装依赖..."
npm run install:all

echo ">>> 构建前端..."
npm run build

echo ">>> 重启 PM2 进程..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  NODE_ENV=production PORT="$PORT" pm2 restart "$APP_NAME" --update-env
  echo "已重启 $APP_NAME"
else
  NODE_ENV=production PORT="$PORT" pm2 start server/index.js --name "$APP_NAME"
  echo "已启动 $APP_NAME"
fi

pm2 save
echo ">>> 部署完成"
