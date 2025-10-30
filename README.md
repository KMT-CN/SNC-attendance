# 签到签退管理系统

一个功能完整的签到签退管理系统，支持多表管理、成员管理、记录跟踪和数据导出。采用前后端分离架构，Docker 容器化部署，HTTPS 安全通信。

## 🌟 主要特性

- ✅ **多表管理**：支持创建多个签到表，灵活管理不同场景
- ✅ **成员管理**：添加、删除、批量操作成员信息
- ✅ **记录追踪**：详细记录签到/签退的日期和时间
- ✅ **数据导出**：支持 CSV 格式导出（Excel 可扩展）
- ✅ **模式切换**：签到/签退模式自由切换
- ✅ **用户认证**：JWT Token 安全认证
- ✅ **响应式设计**：支持桌面和移动设备
- ✅ **Docker 部署**：一键启动，快速部署
- ✅ **HTTPS 支持**：安全的数据传输

## 🏗️ 系统架构

```
                    Internet
                       |
                       ↓
            +--------------------+
            |   反向代理工具      |  ← 你选择（Nginx/Caddy/Cloudflare）
            | (HTTPS + 域名绑定) |
            +--------------------+
                       |
                       ↓
            +--------------------+
            |   后端 API (HTTP)  |  ← Docker 容器
            | 127.0.0.1:10234   |  ← 只监听本地
            +--------------------+
                       |
                       ↓
            +--------------------+
            |   MongoDB 数据库   |  ← Docker 容器
            | 127.0.0.1:27017   |  ← 只监听本地
            +--------------------+
```

**设计理念**：
- 🔒 后端只监听 `127.0.0.1`，不直接暴露到公网
- 🛠️ 用户自由选择反向代理工具
- 🔐 HTTPS、域名、负载均衡由反向代理负责
- � Docker 容器化，一键启动

```
SNC-attendance/
├── Frontend/           # 前端控制面板
│   ├── index.html     # 登录页面
│   ├── dashboard.html # 管理面板
│   ├── css/           # 样式文件
│   └── js/            # JavaScript 逻辑
│       ├── api.js     # API 封装和配置
│       ├── login.js   # 登录逻辑
│       └── dashboard.js # 管理面板逻辑
├── Backend/           # 后端服务
│   ├── src/           # 源代码
│   │   ├── server.js  # Express 服务器
│   │   ├── models/    # MongoDB 模型
│   │   ├── routes/    # API 路由
│   │   └── middleware/ # 中间件
│   ├── docker-compose.yml # Docker 编排
│   ├── Dockerfile     # 容器构建
│   └── nginx.conf     # Nginx 配置
├── DEPLOYMENT.md      # 详细部署指南
└── README.md          # 本文件

```

## 🚀 快速开始

### 前提条件

- Docker 和 Docker Compose
- 反向代理工具（Nginx/Caddy/Cloudflare Tunnel 等）

### 一键部署（5 分钟）

```bash
# 1. 克隆项目
git clone <repository-url>
cd SNC-attendance/Backend

# 2. 配置环境（可选，使用默认配置也可以）
cp .env.example .env
nano .env  # 修改 BACKEND_PORT 和 JWT_SECRET

# 3. 启动后端服务（MongoDB + API）
docker-compose up -d

# 4. 验证服务运行
curl http://127.0.0.1:10234/health
# 应返回：{"status":"ok","mongodb":"connected"}
```

### 配置反向代理

⚠️ **重要**：后端只监听 `127.0.0.1:10234`（端口可配置），必须通过反向代理才能对外访问。

**快速选择反向代理工具**：

| 工具 | 适用场景 | HTTPS | 难度 |
|------|---------|-------|------|
| **Caddy** | VPS/服务器 | 自动 | ⭐ 最简单 |
| **Nginx** | VPS/服务器 | 手动配置 | ⭐⭐ 常用 |
| **Cloudflare Tunnel** | 内网/家庭网络 | 自动 | ⭐⭐ 无需公网IP |

#### 示例：使用 Caddy（推荐）

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
    
    # 前端静态文件
    root * /var/www/attendance
    file_server
    try_files {path} /index.html
}
```

```bash
# 启动 Caddy（自动获取 HTTPS 证书）
sudo systemctl restart caddy
```

📖 **查看详细配置**：[Backend/REVERSE_PROXY.md](./Backend/REVERSE_PROXY.md) - 包含 Nginx、Apache、Cloudflare Tunnel 等 5 种工具的完整配置。

### 创建管理员账户

系统中的第一个注册用户将自动成为 **管理员**。请使用以下命令创建您的管理员账户，并将 `YourSecurePassword123` 替换为您自己的强密码。

```bash
# 通过反向代理访问
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourSecurePassword123"}'

# 或本地测试
curl -X POST http://127.0.0.1:10234/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourSecurePassword123"}'
```

### 配置并部署前端

```bash
# 1. 配置 API 地址
cd Frontend
nano js/api.js  # 修改 BASE_URL 为你的域名

# 2. 部署到 Web 服务器
sudo mkdir -p /var/www/attendance
sudo cp -r * /var/www/attendance/

# 或使用 Python 简易服务器（开发）
python -m http.server 8080
```

### 访问系统

打开浏览器访问 `https://your-domain.com`，使用管理员账户登录即可！

## 📖 使用指南

### 登录系统

1. 访问 `https://your-domain.com`
2. 输入管理员用户名和密码
3. 点击登录

### 创建签到表

1. 进入"签到表管理"标签
2. 填写表格名称和描述
3. 点击"创建签到表"

### 添加成员

1. 进入"成员管理"标签
2. 选择目标签到表
3. 填写成员信息（姓名、学号/工号、联系方式）
4. 点击"添加成员"

### 记录签到/签退

1. 进入"签到记录"标签
2. 选择签到表
3. 选择成员和日期时间
4. 选择签到或签退模式
5. 点击"创建记录"

### 导出数据

1. 进入"签到表管理"标签
2. 找到要导出的表格
3. 点击"导出 CSV"按钮

## 🔧 配置说明

### 自定义后端端口

编辑 `Backend/.env`：
```bash
BACKEND_PORT=8080  # 改成你想要的端口（默认 10234）
JWT_SECRET=生成一个强随机字符串  # 必须修改！
CORS_ORIGIN=https://your-domain.com  # 限制 CORS
```

重启服务：
```bash
docker-compose down
docker-compose up -d
```

### 前端 API 配置

编辑 `Frontend/js/api.js`：
```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-domain.com/api',  // 你的反向代理地址
    TIMEOUT: 30000,
    TOKEN_KEY: 'attendance_token'
};
```

### 前端
- HTML5、CSS3、JavaScript ES6+
- Fetch API
- 响应式设计

### 后端
- Node.js 20
- Express.js 4.18
- MongoDB 7.0
- Mongoose 8.0
- JWT 认证
- bcryptjs 密码加密

### 部署
- Docker & Docker Compose
- Nginx (反向代理 + SSL)
- Let's Encrypt (生产环境 SSL)

## 📚 API 文档

### 认证接口

```http
POST /api/auth/register
POST /api/auth/login
```

### 签到表管理

```http
GET    /api/tables
POST   /api/tables
PUT    /api/tables/:id
DELETE /api/tables/:id
```

### 成员管理

```http
GET    /api/members
POST   /api/members
PUT    /api/members/:id
DELETE /api/members/:id
DELETE /api/members/batch
```

### 签到记录

```http
GET    /api/records
POST   /api/records
PUT    /api/records/:id
DELETE /api/records/:id
```

### 系统设置

```http
GET /api/settings
PUT /api/settings
```

详细的 API 文档请参考 [Backend/API.md](./Backend/API.md)

## 🔒 安全建议

### 生产环境必须配置

1. **修改默认密码**
   ```bash
   # Backend/.env
   JWT_SECRET=$(openssl rand -base64 32)  # 使用强随机字符串
   ```

2. **限制 CORS**
   ```bash
   # Backend/.env
   CORS_ORIGIN=https://your-domain.com  # 不要使用 *
   ```

3. **使用 HTTPS**
   - Caddy：自动获取 Let's Encrypt 证书
   - Nginx：使用 `certbot --nginx`
   - Cloudflare：自动 HTTPS

4. **配置防火墙**
   ```bash
   # 只开放必要端口（80/443）
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

5. **定期备份数据库**
   ```bash
   # 备份脚本
   docker exec snc-attendance-mongodb mongodump \
     --uri="mongodb://admin:password@localhost:27017/attendance?authSource=admin" \
     --out=/tmp/backup
   
   docker cp snc-attendance-mongodb:/tmp/backup ./backup_$(date +%Y%m%d)
   ```

6. **更新依赖版本**
   ```bash
   cd Backend
   npm audit fix
   docker-compose build --no-cache
   docker-compose up -d
   ```

## 🛠️ 开发指南

### 本地开发环境

```bash
# 后端开发
cd Backend
npm install
npm run dev  # 使用 nodemon 自动重启

# 前端开发
cd Frontend
# 使用 Live Server 或 http-server
npx http-server -p 8080
```

### 系统重置与测试

当你需要重新测试部署流程或清除所有数据时：

```powershell
# Windows PowerShell
.\reset-data.ps1    # 仅清除数据（保留镜像和配置）
.\reset.ps1         # 完全重置（删除所有容器、卷、镜像和配置）
```

```bash
# Linux/macOS
./reset-data.sh     # 仅清除数据（保留镜像和配置）
./reset.sh          # 完全重置（删除所有容器、卷、镜像和配置）
```

详细说明请查看：[DOCKER-RESET.md](./DOCKER-RESET.md)

### 数据库管理

```bash
# 连接 MongoDB
docker exec -it snc-mongodb mongosh \
  -u admin -p your_password --authenticationDatabase admin

# 查看数据库
use attendance_db
show collections
db.users.find()

# 或使用 Node.js 脚本（无需 mongosh）
cd Backend
node check-users.js   # 查看所有用户
node clear-users.js   # 清除所有用户
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f mongodb
docker-compose logs -f nginx
```

## 📝 待办事项

- [ ] 添加 Excel 导出功能
- [ ] 实现数据统计和图表
- [ ] 添加邮件通知功能
- [ ] 支持微信扫码签到
- [ ] 移动端原生应用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 支持

如有问题，请：
1. 查看 [DEPLOYMENT-QUICK.md](./DEPLOYMENT-QUICK.md) 快速部署指南
2. 查看 [Backend/REVERSE_PROXY.md](./Backend/REVERSE_PROXY.md) 反向代理配置
3. 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 详细部署文档
4. 查看 [DOCKER-RESET.md](./DOCKER-RESET.md) 系统重置指南
5. 查看 [USER-MANAGEMENT.md](./USER-MANAGEMENT.md) 用户管理文档
6. 检查浏览器控制台错误信息
7. 查看 Docker 日志：`docker-compose logs`
8. 提交 GitHub Issue

**常见问题**：
- 502 错误 → 检查后端是否运行：`curl http://127.0.0.1:10234/health`
- CORS 错误 → 修改 Backend/.env 中的 CORS_ORIGIN
- 登录失败 → 确认已创建管理员账户
- 无法访问 → 检查反向代理配置和防火墙
- 需要重新测试 → 使用 `reset-data.ps1` 或 `reset.ps1` 重置系统

---

**版本**: 1.0.0  
**最后更新**: 2024
