#!/bin/bash

# Manus账号邀请管理系统 - 一键部署脚本
# 适用于 Ubuntu 20.04+

set -e

echo "=========================================="
echo "  Manus账号邀请管理系统 - 一键部署脚本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 root 用户运行此脚本${NC}"
    echo "使用: sudo bash deploy.sh"
    exit 1
fi

# 获取用户输入
read -p "请输入数据库密码 (默认: manus123): " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-manus123}

read -p "请输入JWT密钥 (留空则随机生成): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
fi

read -p "请输入服务端口 (默认: 3000): " PORT
PORT=${PORT:-3000}

read -p "请输入域名或IP (默认: localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

echo ""
echo -e "${YELLOW}开始部署...${NC}"
echo ""

# 1. 更新系统
echo -e "${GREEN}[1/8] 更新系统包...${NC}"
apt update && apt upgrade -y

# 2. 安装依赖
echo -e "${GREEN}[2/8] 安装必要依赖...${NC}"
apt install -y curl git mysql-server nginx

# 3. 安装 Node.js
echo -e "${GREEN}[3/8] 安装 Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# 安装 pnpm
npm install -g pnpm

# 4. 配置 MySQL
echo -e "${GREEN}[4/8] 配置 MySQL 数据库...${NC}"
systemctl start mysql
systemctl enable mysql

mysql -e "CREATE DATABASE IF NOT EXISTS manus_account_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'manus'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "ALTER USER 'manus'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON manus_account_manager.* TO 'manus'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 5. 配置项目
echo -e "${GREEN}[5/8] 配置项目...${NC}"
PROJECT_DIR="/opt/manus-account-manager"

if [ -d "$PROJECT_DIR" ]; then
    echo "项目目录已存在，更新文件..."
    rm -rf "$PROJECT_DIR"
fi

# 复制当前目录到项目目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cp -r "$SCRIPT_DIR" "$PROJECT_DIR"

cd "$PROJECT_DIR"

# 创建环境变量文件
echo "DATABASE_URL=\"mysql://manus:${DB_PASSWORD}@localhost:3306/manus_account_manager\"" > .env
echo "JWT_SECRET=\"${JWT_SECRET}\"" >> .env
echo "PORT=${PORT}" >> .env
echo "NODE_ENV=production" >> .env

# 6. 安装依赖并构建
echo -e "${GREEN}[6/8] 安装依赖并构建...${NC}"
pnpm install
pnpm db:push
pnpm build

# 7. 配置 PM2
echo -e "${GREEN}[7/8] 配置 PM2 进程管理...${NC}"
npm install -g pm2

# 停止已有进程
pm2 delete manus-account-manager 2>/dev/null || true

# 启动服务
pm2 start npm --name "manus-account-manager" -- start
pm2 save
pm2 startup

# 8. 配置 Nginx
echo -e "${GREEN}[8/8] 配置 Nginx 反向代理...${NC}"

cat > /etc/nginx/sites-available/manus-account-manager << NGINX_CONF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINX_CONF

# 启用站点配置
ln -sf /etc/nginx/sites-available/manus-account-manager /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx

echo ""
echo "=========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址: http://${DOMAIN}"
echo ""
echo "登录信息:"
echo "  用户名: admin"
echo "  密码: Asd123456."
echo ""
echo "数据库信息:"
echo "  数据库: manus_account_manager"
echo "  用户名: manus"
echo "  密码: ${DB_PASSWORD}"
echo ""
echo "管理命令:"
echo "  查看日志: pm2 logs manus-account-manager"
echo "  重启服务: pm2 restart manus-account-manager"
echo "  停止服务: pm2 stop manus-account-manager"
echo ""
echo -e "${YELLOW}安全提示: 请立即修改默认登录密码！${NC}"
echo ""
