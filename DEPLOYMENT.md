# 签到签退系统 - 部署指南

完整的部署文档，包含后端和前端的部署说明。

## 目录

1. [系统架构](#系统架构)
2. [前提条件](#前提条件)
3. [后端部署](#后端部署)
4. [前端部署](#前端部署)
5. [配置说明](#配置说明)
6. [故障排查](#故障排查)

## 系统架构

```
┌─────────────┐      HTTPS      ┌──────────────┐
│   前端      │  ───────────────> │    Nginx     │
│  (HTML/JS)  │                   │  (反向代理)   │
└─────────────┘                   └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   Node.js    │
                                  │   Backend    │
                                  └──────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   MongoDB    │
                                  └──────────────┘
```

## 前提条件

### 服务器要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+ 或 CentOS 7+)
- **CPU**: 2核心或以上
- **内存**: 2GB 或以上
- **硬盘**: 20GB 或以上
- **网络**: 公网 IP 或域名

### 软件要求
- Docker 20.10+
- Docker Compose 1.29+
- Git (用于克隆代码)

### 安装 Docker 和 Docker Compose

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 设置 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
docker compose version
```

**CentOS/RHEL:**
```bash
# 安装 Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

## 后端部署

### 1. 克隆代码

```bash
cd /opt
git clone https://github.com/your-repo/SNC-attendance.git
cd SNC-attendance/Backend
```

### 2. 生成 SSL 证书

**开发环境（自签名证书）:**
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=SNC/CN=your-domain.com"
```

**生产环境（Let's Encrypt 证书）:**
```bash
# 安装 Certbot
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到项目目录
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chmod 644 ssl/*.pem
```

### 3. 配置环境变量

```bash
cp .env.example .env
vim .env
```

**重要配置项:**
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://admin:YOUR_STRONG_PASSWORD@mongodb:27017/attendance?authSource=admin
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_CHANGE_THIS
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

⚠️ **安全提示:**
- 修改 MongoDB 密码（docker-compose.yml 中的 MONGO_INITDB_ROOT_PASSWORD）
- 生成强随机的 JWT_SECRET
- 生产环境中设置具体的 CORS_ORIGIN

### 4. 启动服务

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 5. 初始化管理员账户

后端首次启动后，需要创建管理员账户：

```bash
# 方法1: 使用 API 注册
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'

# 方法2: 直接在 MongoDB 中创建
docker exec -it snc-attendance-mongodb mongosh
use admin
db.auth("admin", "your_password")
use attendance
db.users.insertOne({
  username: "admin",
  password: "$2a$10$...",  // 使用 bcrypt 加密后的密码
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 6. 验证后端服务

```bash
# 健康检查
curl -k https://your-domain.com/health

# 登录测试
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

## 前端部署

### 方式一：部署到 Web 服务器

#### 1. 配置 API 地址

编辑 `Frontend/js/api.js`：

```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-domain.com:443/api',  // 修改为实际域名
    TIMEOUT: 30000,
    TOKEN_KEY: 'attendance_token'
};
```

#### 2. 部署到 Nginx

```bash
# 复制前端文件到 Web 目录
sudo cp -r Frontend/* /var/www/html/attendance/

# 配置 Nginx
sudo vim /etc/nginx/sites-available/attendance-frontend
```

**Nginx 配置示例:**
```nginx
server {
    listen 80;
    server_name frontend.your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name frontend.your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    root /var/www/html/attendance;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/attendance-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 方式二：使用后端 Nginx 一起部署

将前端文件放到后端 Nginx 容器中：

```bash
# 1. 修改 docker-compose.yml，添加前端文件挂载
vim docker-compose.yml
```

在 nginx 服务中添加：
```yaml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
  - ./ssl:/etc/nginx/ssl:ro
  - ./nginx-logs:/var/log/nginx
  - ../Frontend:/usr/share/nginx/html:ro  # 添加这行
```

```bash
# 2. 重启服务
docker compose restart nginx
```

### 方式三：使用静态文件托管服务

可以将前端部署到：
- GitHub Pages
- Vercel
- Netlify
- 阿里云 OSS
- 腾讯云 COS

记得在 `api.js` 中配置正确的后端 API 地址。

## 配置说明

### API 地址配置

前端需要配置后端 API 地址。编辑 `Frontend/js/api.js`：

**使用域名:**
```javascript
BASE_URL: 'https://api.example.com/api'
```

**使用 IP 地址:**
```javascript
BASE_URL: 'https://192.168.1.100:443/api'
```

**本地开发:**
```javascript
BASE_URL: 'http://localhost:3000/api'
```

### 防火墙配置

确保以下端口开放：

```bash
# Ubuntu (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS (Firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### MongoDB 备份

```bash
# 创建备份脚本
cat > /opt/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec snc-attendance-mongodb mongodump \
  --username admin \
  --password YOUR_PASSWORD \
  --authenticationDatabase admin \
  --db attendance \
  --out /tmp/backup

docker cp snc-attendance-mongodb:/tmp/backup $BACKUP_DIR/backup_$DATE

# 保留最近7天的备份
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /opt/backup-mongodb.sh

# 添加到 crontab（每天凌晨2点备份）
echo "0 2 * * * /opt/backup-mongodb.sh" | crontab -
```

## 故障排查

### 1. 后端无法启动

```bash
# 查看日志
docker compose logs backend

# 检查 MongoDB 连接
docker exec -it snc-attendance-backend node -e "
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('OK'))
    .catch(err => console.error('Error:', err));
"
```

### 2. 前端无法连接后端

**检查项:**
- API 地址是否正确（`js/api.js`）
- 浏览器是否允许 HTTPS 连接（自签名证书需要手动信任）
- 后端是否正常运行
- 防火墙是否开放端口
- CORS 配置是否正确

**浏览器控制台检查:**
```javascript
// 打开浏览器控制台 (F12)，执行：
fetch('https://your-domain.com/health')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));
```

### 3. MongoDB 连接失败

```bash
# 进入 MongoDB 容器
docker exec -it snc-attendance-mongodb mongosh

# 测试连接
use admin
db.auth("admin", "your_password")
use attendance
db.users.find()
```

### 4. SSL 证书问题

```bash
# 检查证书文件
ls -la ssl/

# 检查证书有效性
openssl x509 -in ssl/cert.pem -text -noout

# 测试 HTTPS 连接
curl -k -v https://your-domain.com/health
```

### 5. 查看服务状态

```bash
# 查看所有容器状态
docker compose ps

# 查看资源使用
docker stats

# 重启特定服务
docker compose restart backend
docker compose restart mongodb
docker compose restart nginx
```

## 性能优化建议

1. **启用 HTTP/2**: Nginx 配置中已默认启用
2. **启用 Gzip 压缩**: Nginx 配置中已默认启用
3. **配置 CDN**: 对静态资源使用 CDN 加速
4. **数据库索引**: 后端已创建必要索引
5. **连接池**: MongoDB 使用默认连接池配置

## 安全加固

1. **修改默认密码**: 所有默认密码都需要修改
2. **限制IP访问**: 使用防火墙限制访问
3. **定期更新**: 及时更新依赖包和镜像
4. **启用日志监控**: 配置日志收集和告警
5. **SSL 证书更新**: Let's Encrypt 证书每90天需要更新

## 更新部署

```bash
# 1. 拉取最新代码
cd /opt/SNC-attendance
git pull

# 2. 重新构建镜像
cd Backend
docker compose build

# 3. 重启服务
docker compose down
docker compose up -d

# 4. 更新前端
# 如果前端单独部署，复制新文件到 Web 目录
```

## 许可证

MIT License
