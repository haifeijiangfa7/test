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
# 解压源码包
unzip manus-account-manager-v3.zip -d /opt/
cd /opt/manus-account-manager

# 安装依赖
pnpm install
```

### 4. 配置环境变量

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL="mysql://manus:your_password_here@localhost:3306/manus_account_manager"

# JWT密钥（请更换为随机字符串）
JWT_SECRET="your_jwt_secret_key_here_change_this"

# 服务器端口
PORT=3000

# 生产环境
NODE_ENV=production
```

### 5. 初始化数据库

```bash
pnpm db:push
```

### 6. 构建生产版本

```bash
pnpm build
```

### 7. 启动服务

```bash
# 使用 PM2 管理进程（推荐）
npm install -g pm2
pm2 start npm --name "manus-account-manager" -- start
pm2 save
pm2 startup
```

## 使用 Nginx 反向代理

```bash
sudo apt install -y nginx

# 配置 Nginx
sudo cat > /etc/nginx/sites-available/manus-account-manager << 'EOF'
server {
    listen 80;
    server_name your_domain.com;

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

sudo ln -s /etc/nginx/sites-available/manus-account-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 登录信息

- **用户名**: admin
- **密码**: Asd123456.

> ⚠️ **安全提示**: 部署到生产环境后，请立即修改默认密码！

## 管理命令

```bash
# 查看日志
pm2 logs manus-account-manager

# 重启服务
pm2 restart manus-account-manager

# 停止服务
pm2 stop manus-account-manager
```

## 数据库备份

```bash
mysqldump -u manus -p manus_account_manager > backup_$(date +%Y%m%d).sql
```
