# 签到签退系统 - 快速部署指南

## 🏗️ 系统架构

```
              Internet
                 ↓
      +--------------------+
      |   反向代理工具      |  ← 你选择的工具（Nginx/Caddy/Cloudflare等）
      |  (HTTPS/域名绑定)  |
      +--------------------+
                 ↓
      +--------------------+
      |  后端 API (HTTP)   |  ← Docker 容器
      | 127.0.0.1:10234   |  ← 只监听本地
      +--------------------+
                 ↓
      +--------------------+
      |  MongoDB 数据库    |  ← Docker 容器
      | 127.0.0.1:27017   |  ← 只监听本地
      +--------------------+
```

**核心理念**：
- 后端只暴露 HTTP 到本地回环地址 `127.0.0.1`
- 用户自由选择反向代理工具（Nginx、Caddy、Cloudflare Tunnel 等）
- 反向代理负责 HTTPS、域名、负载均衡等功能

---

## 🚀 快速开始（5 分钟部署）

### 步骤 1：安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

### 步骤 2：启动后端

```bash
# 克隆项目
git clone <your-repo-url>
cd SNC-attendance/Backend

# 配置环境（可选，使用默认配置也可以）
cp .env.example .env
nano .env  # 修改 JWT_SECRET 和 BACKEND_PORT

# 启动服务
docker-compose up -d

# 验证运行
curl http://127.0.0.1:10234/health
# 应返回：{"status":"ok",...}
```

### 步骤 3：配置反向代理

**选项 A - Caddy（最简单，推荐新手）**

```bash
# 安装 Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# 配置 Caddy
sudo nano /etc/caddy/Caddyfile
```

Caddyfile 内容：
```caddyfile
your-domain.com {
    reverse_proxy /api/* 127.0.0.1:10234
    reverse_proxy /health 127.0.0.1:10234
    
    # 前端静态文件（可选）
    root * /var/www/attendance
    file_server
    try_files {path} /index.html
}
```

启动 Caddy：
```bash
sudo systemctl restart caddy
```

**选项 B - Nginx（最流行）**

```bash
# 安装 Nginx
sudo apt install nginx certbot python3-certbot-nginx

# 配置 Nginx
sudo nano /etc/nginx/sites-available/attendance
```

Nginx 配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:10234/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:10234/health;
    }

    # 前端静态文件
    location / {
        root /var/www/attendance;
        try_files $uri $uri/ /index.html;
    }
}
```

启用并获取 SSL：
```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

**选项 C - Cloudflare Tunnel（无需公网 IP）**

```bash
# 安装 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 登录并创建隧道
cloudflared tunnel login
cloudflared tunnel create attendance-api

# 配置隧道
nano ~/.cloudflared/config.yml
```

配置文件：
```yaml
tunnel: <your-tunnel-id>
credentials-file: /home/<user>/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: api.your-domain.com
    service: http://127.0.0.1:10234
  - service: http_status:404
```

启动隧道：
```bash
cloudflared tunnel route dns attendance-api api.your-domain.com
cloudflared tunnel run attendance-api
```

> 📖 **详细配置指南**：查看 [Backend/REVERSE_PROXY.md](./Backend/REVERSE_PROXY.md) 获取更多反向代理选项和配置细节。

### 步骤 4：创建管理员账户

```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourSecurePassword123"}'
```

### 步骤 5：部署前端

```bash
# 配置 API 地址
cd ../Frontend
nano js/api.js  # 修改 BASE_URL 为你的域名

# 部署到 Web 服务器
sudo mkdir -p /var/www/attendance
sudo cp -r * /var/www/attendance/
```

或部署到静态托管平台：
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: 推送到 `gh-pages` 分支

### 步骤 6：访问系统

打开浏览器访问 `https://your-domain.com`，使用刚创建的管理员账户登录。

---

## 📝 配置说明

### 环境变量（Backend/.env）

```bash
# 后端监听端口（可自定义）
BACKEND_PORT=10234

# JWT 密钥（生产环境必须修改！）
JWT_SECRET=生成一个复杂的随机字符串

# CORS 配置（建议限制为前端域名）
CORS_ORIGIN=https://your-domain.com

# MongoDB 密码（需同时修改 docker-compose.yml）
MONGODB_PASSWORD=your_secure_password

# Token 过期时间
JWT_EXPIRES_IN=7d
```

### 端口配置

编辑 `Backend/.env`：
```bash
BACKEND_PORT=8080  # 改成你想要的端口
```

然后重启服务：
```bash
docker-compose down
docker-compose up -d
```

### 前端 API 配置

编辑 `Frontend/js/api.js`：
```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-domain.com/api',  // 改成你的域名
    TIMEOUT: 30000,
    TOKEN_KEY: 'attendance_token'
};
```

---

## 🔒 安全建议

### 1. 修改默认密码

```bash
# 修改 JWT_SECRET
nano Backend/.env
# 生成强随机字符串：
openssl rand -base64 32

# 修改 MongoDB 密码
nano Backend/docker-compose.yml
# 同时修改 MONGO_INITDB_ROOT_PASSWORD
```

### 2. 配置防火墙

```bash
# 只开放 80 和 443 端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 3. 限制 CORS

```bash
# Backend/.env
CORS_ORIGIN=https://your-domain.com  # 不要使用 *
```

### 4. 定期备份数据库

```bash
# 创建备份脚本
nano backup.sh
```

backup.sh：
```bash
#!/bin/bash
BACKUP_DIR="/backups/attendance"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec snc-attendance-mongodb mongodump \
  --uri="mongodb://admin:snc_attendance_2025@localhost:27017/attendance?authSource=admin" \
  --out=/tmp/backup

docker cp snc-attendance-mongodb:/tmp/backup $BACKUP_DIR/backup_$DATE

# 只保留最近 7 天的备份
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +

echo "备份完成: $BACKUP_DIR/backup_$DATE"
```

设置定时任务：
```bash
chmod +x backup.sh
crontab -e
# 添加：每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

---

## 🛠️ 管理命令

### Docker 服务管理

```bash
cd Backend

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f backend  # 只看后端日志

# 重启服务
docker-compose restart
docker-compose restart backend  # 只重启后端

# 停止服务
docker-compose stop

# 完全删除服务和数据
docker-compose down -v
```

### 数据库管理

```bash
# 连接 MongoDB
docker exec -it snc-attendance-mongodb mongosh \
  -u admin -p snc_attendance_2025 --authenticationDatabase admin

# MongoDB Shell 命令
use attendance
show collections
db.users.find()
db.tables.find()
db.records.countDocuments()
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
cd Backend
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🆘 故障排查

### 问题 1：无法连接后端

**检查后端是否运行**：
```bash
docker ps | grep backend
curl http://127.0.0.1:10234/health
```

**查看后端日志**：
```bash
docker logs snc-attendance-backend
```

### 问题 2：502 Bad Gateway

**原因**：反向代理无法连接到后端

**解决**：
1. 确认后端端口：`netstat -tlnp | grep 10234`
2. 检查防火墙：`sudo ufw status`
3. 查看反向代理配置
4. 重启反向代理：`sudo systemctl restart nginx` 或 `sudo systemctl restart caddy`

### 问题 3：CORS 错误

**原因**：CORS 配置不正确

**解决**：
1. 编辑 `Backend/.env`
2. 设置 `CORS_ORIGIN=https://your-frontend-domain.com`
3. 重启后端：`docker-compose restart backend`

### 问题 4：MongoDB 连接失败

**检查 MongoDB 状态**：
```bash
docker logs snc-attendance-mongodb
docker exec snc-attendance-mongodb mongosh --eval "db.runCommand('ping')"
```

**重启 MongoDB**：
```bash
docker-compose restart mongodb
```

### 问题 5：Token 过期

**症状**：前端显示"未授权"错误

**解决**：
- 清除浏览器缓存
- 重新登录
- 检查 JWT_EXPIRES_IN 设置

---

## 📊 性能优化

### 1. 启用 Gzip 压缩

Nginx 配置：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

Caddy 会自动启用压缩。

### 2. 配置缓存

Nginx 配置：
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 启用 HTTP/2

Nginx：
```nginx
listen 443 ssl http2;
```

Caddy 自动启用 HTTP/2 和 HTTP/3。

### 4. 数据库索引

MongoDB 已自动创建索引，查看索引：
```bash
docker exec -it snc-attendance-mongodb mongosh \
  -u admin -p snc_attendance_2025 --authenticationDatabase admin

use attendance
db.records.getIndexes()
```

---

## 🔗 相关文档

- [反向代理详细配置](./Backend/REVERSE_PROXY.md) - 5 种反向代理工具的完整配置指南
- [前端 README](./Frontend/README.md) - 前端部署和配置
- [后端 README](./Backend/README.md) - 后端 API 文档
- [主 README](./README.md) - 项目总览

---

## 📞 获取帮助

1. 查看日志：`docker-compose logs -f`
2. 检查 GitHub Issues
3. 查看相关文档

**常见问题解决时间**：
- 后端启动：30 秒内
- 获取 SSL 证书：1-2 分钟
- 完整部署：5-10 分钟

---

**最后更新**: 2025-10-26
