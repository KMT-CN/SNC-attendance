# 签到签退系统 - 后端服务

基于 Node.js + Express + MongoDB 的后端 API 服务。

## 🌟 特性

- ✅ RESTful API 设计
- ✅ JWT Token 认证
- ✅ MongoDB 数据持久化
- ✅ Docker 容器化部署
- ✅ **只监听 127.0.0.1**（安全设计）
- ✅ 用户自选反向代理工具
- ✅ CORS 跨域支持
- ✅ 请求速率限制
- ✅ 安全头部配置（Helmet）

## 🏗️ 架构设计

```
        Internet
           ↓
   反向代理工具（你选择）
   (Nginx/Caddy/Cloudflare)
           ↓
   后端 API (HTTP)
   127.0.0.1:10234  ← 只监听本地
           ↓
       MongoDB
   127.0.0.1:27017  ← 只监听本地
```

**为什么只监听 127.0.0.1？**

| 传统方案 | 本方案 |
|---------|--------|
| 后端直接暴露端口 | 只监听本地回环地址 |
| 需要配置防火墙 | 天然隔离外部访问 |
| HTTPS 在后端配置 | HTTPS 由反向代理负责 |
| 证书管理复杂 | 证书由反向代理管理 |
| 难以更换反向代理 | 灵活选择工具 |

**优势**：
- 🔒 **更安全**：后端不直接暴露到公网
- 🛠️ **更灵活**：自由选择 Nginx、Caddy、Cloudflare Tunnel 等
- 🔐 **统一入口**：所有外部请求经过反向代理过滤
- 📦 **易管理**：反向代理负责 HTTPS、域名、负载均衡

## 🚀 快速开始

### 使用 Docker（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
nano .env  # 修改 BACKEND_PORT 和 JWT_SECRET

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps
docker-compose logs -f

# 4. 验证运行
curl http://127.0.0.1:10234/health
# 应返回：{"status":"ok","mongodb":"connected"}
```

### 本地开发（不使用 Docker）

```bash
# 1. 安装依赖
npm install

# 2. 启动 MongoDB
# 确保 MongoDB 运行在 localhost:27017

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 启动开发服务器（自动重启）
npm run dev

# 或生产模式
npm start
```

## 📁 项目结构

```
Backend/
├── src/
│   ├── server.js           # 入口文件
│   ├── models/            # MongoDB 模型
│   │   ├── User.js        # 用户模型
│   │   ├── Table.js       # 签到表模型
│   │   ├── Member.js      # 成员模型
│   │   ├── Record.js      # 签到记录模型
│   │   └── Settings.js    # 系统设置模型
│   ├── routes/            # API 路由
│   │   ├── auth.js        # 认证路由
│   │   ├── tables.js      # 签到表路由
│   │   ├── members.js     # 成员路由
│   │   ├── records.js     # 记录路由
│   │   └── settings.js    # 设置路由
│   └── middleware/        # 中间件
│       └── auth.js        # JWT 认证中间件
├── docker-compose.yml     # Docker 编排文件
├── Dockerfile            # Docker 镜像构建
├── package.json          # 依赖配置
├── .env.example         # 环境变量模板
└── README.md            # 本文档
```

## 🔧 配置说明

### 环境变量（.env）

```bash
# Node 环境
NODE_ENV=production

# 后端监听端口（可自定义，默认 10234）
BACKEND_PORT=10234

# MongoDB 连接
MONGODB_URI=mongodb://admin:password@mongodb:27017/attendance?authSource=admin

# JWT 配置（生产环境必须修改！）
JWT_SECRET=your_very_secure_random_string_here
JWT_EXPIRES_IN=7d

# CORS 配置（建议限制为前端域名）
CORS_ORIGIN=https://your-domain.com

# 日志级别
LOG_LEVEL=info
```

### 自定义端口

修改 `.env`：
```bash
BACKEND_PORT=8080  # 改成你想要的端口
```

修改 `docker-compose.yml`：
```yaml
ports:
  - "127.0.0.1:8080:8080"  # 改成你的端口
environment:
  PORT: 8080
```

重启服务：
```bash
docker-compose down
docker-compose up -d
```

## 📚 API 文档

### 基础信息

- **Base URL**: `http://127.0.0.1:10234` (本地)
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

### 认证接口

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

响应：
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin"
  }
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

响应：同注册
```

### 签到表接口

#### 获取所有签到表
```http
GET /api/tables
Authorization: Bearer {token}

响应：
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "计算机科学系签到表",
      "description": "2025年春季学期",
      "createdBy": "...",
      "createdAt": "2025-10-26T..."
    }
  ]
}
```

#### 创建签到表
```http
POST /api/tables
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "新签到表",
  "description": "描述信息"
}
```

#### 更新签到表
```http
PUT /api/tables/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "更新后的名称",
  "description": "更新后的描述"
}
```

#### 删除签到表
```http
DELETE /api/tables/:id
Authorization: Bearer {token}
```

### 成员接口

#### 获取成员列表
```http
GET /api/members?tableId={tableId}
Authorization: Bearer {token}
```

#### 添加成员
```http
POST /api/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "tableId": "...",
  "name": "张三",
  "employeeId": "20250001",
  "contact": "13800138000"
}
```

#### 批量删除成员
```http
DELETE /api/members/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "memberIds": ["id1", "id2", "id3"]
}
```

### 签到记录接口

#### 获取记录
```http
GET /api/records?tableId={tableId}&date={YYYY-MM-DD}
Authorization: Bearer {token}
```

#### 创建记录
```http
POST /api/records
Authorization: Bearer {token}
Content-Type: application/json

{
  "tableId": "...",
  "memberId": "...",
  "type": "checkin",  // 或 "checkout"
  "checkinDate": "2025-10-26",
  "checkinTime": "09:00"
}
```

### 系统设置接口

#### 获取设置
```http
GET /api/settings
Authorization: Bearer {token}
```

#### 更新设置
```http
PUT /api/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "activeTable": "tableId",
  "mode": "checkin"  // 或 "checkout"
}
```

### 健康检查

```http
GET /health

响应：
{
  "status": "ok",
  "timestamp": "2025-10-26T...",
  "mongodb": "connected"
}
```

## 🔐 安全配置

### 1. 修改 JWT 密钥

```bash
# 生成强随机字符串
openssl rand -base64 32

# 更新 .env
JWT_SECRET=生成的随机字符串
```

### 2. 限制 CORS

```bash
# .env
CORS_ORIGIN=https://your-domain.com  # 不要使用 *
```

### 3. 配置速率限制

当前配置：15 分钟内最多 100 个请求

修改 `src/server.js`：
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50  // 改成你想要的限制
});
```

### 4. 修改 MongoDB 密码

编辑 `docker-compose.yml`：
```yaml
environment:
  MONGO_INITDB_ROOT_PASSWORD: your_new_secure_password
```

同时更新 `.env` 中的 `MONGODB_URI`。

## 🛠️ 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式（自动重启）

```bash
npm run dev
```

使用 `nodemon` 监听文件变化，自动重启服务。

### 生产模式

```bash
npm start
```

### 代码格式化

```bash
npm run format
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
db.members.countDocuments()
db.records.find().sort({createdAt: -1}).limit(10)

# 创建索引（已自动创建）
db.records.getIndexes()

# 清空某个表的数据（谨慎！）
db.records.deleteMany({})
```

### 日志查看

```bash
# Docker 日志
docker-compose logs -f backend

# 本地日志
# 日志文件在 logs/ 目录
tail -f logs/backend.log
```

## 📊 性能优化

### 1. MongoDB 索引

已自动创建的索引：
```javascript
// Member 模型
{ tableId: 1, employeeId: 1 }  // 唯一索引

// Record 模型
{ tableId: 1, memberId: 1 }
{ checkinDate: 1 }
{ createdAt: -1 }
```

### 2. 连接池配置

`src/server.js` 中的 MongoDB 连接：
```javascript
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,  // 最大连接数
  minPoolSize: 2,   // 最小连接数
});
```

### 3. 响应压缩

添加压缩中间件（可选）：
```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

## 🔄 反向代理配置

后端只监听 `127.0.0.1:10234`，需要配置反向代理才能对外访问。

详细配置请查看：[REVERSE_PROXY.md](./REVERSE_PROXY.md)

**快速示例（Nginx）**：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:10234/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🆘 故障排查

### 后端无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 10234
lsof -i:10234

# 查看 Docker 日志
docker logs snc-attendance-backend

# 检查 MongoDB 连接
docker logs snc-attendance-mongodb
```

### MongoDB 连接失败

```bash
# 测试 MongoDB
docker exec snc-attendance-mongodb mongosh \
  -u admin -p snc_attendance_2025 --authenticationDatabase admin \
  --eval "db.runCommand('ping')"

# 重启 MongoDB
docker-compose restart mongodb
```

### API 返回 500 错误

查看后端日志：
```bash
docker-compose logs -f backend
```

常见原因：
- MongoDB 未连接
- JWT_SECRET 未配置
- 数据验证失败

### CORS 错误

修改 `.env`：
```bash
CORS_ORIGIN=https://your-frontend-domain.com
```

重启服务：
```bash
docker-compose restart backend
```

## 📝 测试 API

### 使用 curl

```bash
# 注册
curl -X POST http://127.0.0.1:10234/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# 登录（获取 Token）
TOKEN=$(curl -X POST http://127.0.0.1:10234/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' \
  | jq -r '.token')

# 创建签到表
curl -X POST http://127.0.0.1:10234/api/tables \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试签到表","description":"测试用"}'

# 获取所有签到表
curl http://127.0.0.1:10234/api/tables \
  -H "Authorization: Bearer $TOKEN"
```

### 使用 Postman

1. 导入 API 集合
2. 设置环境变量：
   - `BASE_URL`: `http://127.0.0.1:10234`
   - `TOKEN`: 登录后获取的 Token

## 📦 Docker 命令速查

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 删除服务（保留数据）
docker-compose down

# 删除服务和数据
docker-compose down -v

# 重新构建镜像
docker-compose build --no-cache

# 进入容器 Shell
docker exec -it snc-attendance-backend sh
```

## 🔗 相关文档

- [主 README](../README.md) - 项目总览
- [反向代理配置](./REVERSE_PROXY.md) - 详细的反向代理配置指南
- [快速部署指南](../DEPLOYMENT-QUICK.md) - 5 分钟快速部署
- [前端 README](../Frontend/README.md) - 前端文档

---

**版本**: 1.0.0  
**最后更新**: 2025-10-26
