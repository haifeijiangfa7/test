# Manus账号邀请管理系统 - Linux服务器部署指南

## 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**: 18.x 或更高版本
- **MySQL/MariaDB**: 8.0+ 或 MariaDB 10.5+
- **内存**: 最低 1GB RAM
- **磁盘**: 最低 10GB 可用空间

## 快速部署

### 1. 安装依赖

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y curl git mysql-server

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm
```

### 2. 配置 MySQL 数据库

```bash
# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 创建数据库和用户
sudo mysql -e "CREATE DATABASE manus_account_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'manus'@'localhost' IDENTIFIED BY 'your_password_here';"
sudo mysql -e "GRANT ALL PRIVILEGES ON manus_account_manager.* TO 'manus'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 3. 下载并配置项目

```bash
# 克隆项目（或上传源码包）
cd /opt
git clone https://github.com/yourusername/manus-account-manager.git
cd manus-account-manager

# 或者解压源码包
# unzip manus-account-manager-source.zip -d /opt/
# cd /opt/manus-account-manager

# 安装依赖
pnpm install
```

### 4. 配置环境变量

创建 `.env` 文件：

```bash
cat > .env << 'EOF'
# 数据库配置
DATABASE_URL="mysql://manus:your_password_here@localhost:3306/manus_account_manager"

# JWT密钥（请更换为随机字符串）
JWT_SECRET="your_jwt_secret_key_here_change_this"

# 服务器端口
PORT=3000

# 生产环境
NODE_ENV=production
EOF
```

### 5. 初始化数据库

```bash
# 推送数据库结构
pnpm db:push
```

### 6. 构建生产版本

```bash
# 构建前端和后端
pnpm build
```

### 7. 启动服务

```bash
# 直接启动
pnpm start

# 或使用 PM2 管理进程（推荐）
npm install -g pm2
pm2 start npm --name "manus-account-manager" -- start
pm2 save
pm2 startup
```

## 使用 Nginx 反向代理（推荐）

### 安装 Nginx

```bash
sudo apt install -y nginx
```

### 配置 Nginx

```bash
sudo cat > /etc/nginx/sites-available/manus-account-manager << 'EOF'
server {
    listen 80;
    server_name your_domain.com;  # 替换为你的域名或IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# 启用站点配置
sudo ln -s /etc/nginx/sites-available/manus-account-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 配置 HTTPS（可选但推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your_domain.com
```

## 使用 Docker 部署（可选）

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["pnpm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://manus:password@db:3306/manus_account_manager
      - JWT_SECRET=your_jwt_secret_key_here
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=manus_account_manager
      - MYSQL_USER=manus
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### 启动 Docker 容器

```bash
docker-compose up -d
```

## 系统管理

### 查看日志

```bash
# PM2 日志
pm2 logs manus-account-manager

# Docker 日志
docker-compose logs -f app
```

### 重启服务

```bash
# PM2
pm2 restart manus-account-manager

# Docker
docker-compose restart app
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖
pnpm install

# 重新构建
pnpm build

# 重启服务
pm2 restart manus-account-manager
```

## 登录信息

- **用户名**: admin
- **密码**: Asd123456.

> ⚠️ **安全提示**: 部署到生产环境后，请立即修改默认密码！

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000

# 杀死占用进程
sudo kill -9 <PID>
```

### 2. 数据库连接失败

- 检查 MySQL 服务是否运行: `sudo systemctl status mysql`
- 检查数据库用户权限
- 检查 DATABASE_URL 配置是否正确

### 3. 权限问题

```bash
# 确保项目目录权限正确
sudo chown -R $USER:$USER /opt/manus-account-manager
```

### 4. 内存不足

```bash
# 增加 swap 空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 备份与恢复

### 数据库备份

```bash
# 备份
mysqldump -u manus -p manus_account_manager > backup_$(date +%Y%m%d).sql

# 恢复
mysql -u manus -p manus_account_manager < backup_20241226.sql
```

### 定时备份（Cron）

```bash
# 编辑 crontab
crontab -e

# 添加每日凌晨2点备份
0 2 * * * mysqldump -u manus -p'your_password' manus_account_manager > /backup/manus_$(date +\%Y\%m\%d).sql
```

## 技术支持

如有问题，请联系开发者或提交 Issue。
