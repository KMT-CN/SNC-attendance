# Docker Compose 部署 API 连接问题修复

## 问题描述
在 Docker Compose 部署时，注册成功后 dashboard 页面会无限刷新。但是分开部署前后端并直接配置后端 URL（如 `http://localhost:10234/api`）就没有问题。

## 根本原因
前端 Nginx 反向代理配置不够完善，导致 API 请求无法正确转发到后端容器。

## 修复内容

### 1. 改进前端 Nginx 配置 (`Frontend/nginx.conf`)

**改进点：**
- 添加更多 HTTP 头信息传递
- 添加 WebSocket 支持（为未来功能准备）
- 优化缓冲设置
- 添加详细注释说明

**关键配置：**
```nginx
location /api/ {
    proxy_pass http://backend:10234;  # 注意：末尾没有斜杠
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # ... 其他配置
}
```

### 2. 改进前端 API 配置 (`Frontend/js/api.js`)

**新增功能：**
- 自动检测部署环境（file:// 协议 vs HTTP）
- 详细的请求/响应日志
- 更好的错误分类（网络错误 vs API 错误）
- 显示 API 配置信息用于调试

**日志输出示例：**
```
📋 API 配置:
  - BASE_URL: /api
  - 当前域名: http://localhost:8080
  - 当前路径: /index.html

🌐 API 请求: POST /api/auth/login
📡 API 响应: 200 OK - http://localhost:8080/api/auth/login
✅ API 成功: http://localhost:8080/api/auth/login
```

### 3. 新增 API 测试工具 (`Frontend/test-api.html`)

**功能：**
- 显示当前环境信息
- 测试健康检查接口
- 测试 API 路由配置
- 网络诊断工具
- 提供详细的排查建议

## 部署步骤

### 方式一：使用 Docker Compose（推荐）

1. **停止现有服务**
   ```powershell
   cd D:\SNC-attendance\deploy
   docker-compose down
   ```

2. **重新构建前端镜像**（因为修改了 Nginx 配置）
   ```powershell
   cd D:\SNC-attendance\Frontend
   docker build -t kmtcn/snc-attendance-frontend:latest .
   ```

3. **启动服务**
   ```powershell
   cd D:\SNC-attendance\deploy
   docker-compose up -d
   ```

4. **验证服务状态**
   ```powershell
   # 查看容器状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   ```

5. **测试 API 连接**
   - 访问测试页面：`http://localhost:8080/test-api.html`
   - 点击各个测试按钮
   - 检查测试结果

6. **测试注册流程**
   - 访问：`http://localhost:8080`
   - 创建超级管理员账户
   - 应该能成功登录并进入 dashboard
   - **不应该出现无限刷新**

### 方式二：分离部署（开发/调试用）

如果 Docker Compose 方式仍有问题，可以临时使用分离部署：

1. **启动后端**
   ```powershell
   cd D:\SNC-attendance\Backend
   docker-compose up -d
   # 或直接运行：node src/server.js
   ```

2. **修改前端 API 配置**
   
   编辑 `Frontend/js/api.js`，取消注释直接访问模式：
   ```javascript
   BASE_URL: 'http://localhost:10234/api',  // 直接访问后端
   ```

3. **启动前端**（使用任意 HTTP 服务器）
   ```powershell
   cd D:\SNC-attendance\Frontend
   # 使用 Python
   python -m http.server 8080
   
   # 或使用 Node.js http-server
   npx http-server -p 8080
   ```

## 诊断步骤

如果问题仍然存在，请按以下步骤诊断：

### 1. 检查容器状态
```powershell
docker-compose ps
```
确保所有容器都是 `Up` 状态。

### 2. 查看日志
```powershell
# 查看所有日志
docker-compose logs

# 实时查看后端日志
docker-compose logs -f backend

# 实时查看前端日志
docker-compose logs -f frontend
```

### 3. 测试容器间网络
```powershell
# 从前端容器 ping 后端
docker-compose exec frontend ping backend

# 从前端容器访问后端健康检查
docker-compose exec frontend wget -O- http://backend:10234/health
```

### 4. 检查 Nginx 配置
```powershell
# 查看 Nginx 配置
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# 测试配置语法
docker-compose exec frontend nginx -t

# 重新加载配置
docker-compose exec frontend nginx -s reload
```

### 5. 使用浏览器开发者工具

打开浏览器开发者工具（F12）：

**Console 标签**：
- 查看 API 配置日志
- 查看请求/响应日志
- 查看任何 JavaScript 错误

**Network 标签**：
- 查看所有网络请求
- 检查失败的请求（红色）
- 查看请求详情（Headers, Preview, Response）
- 特别关注 `/api/` 开头的请求

**Application 标签**：
- 查看 Local Storage
- 检查 `attendance_token` 是否存在
- 检查用户信息是否正确保存

### 6. 使用 API 测试工具

访问 `http://localhost:8080/test-api.html` 并运行所有测试。

## 常见问题

### Q1: 502 Bad Gateway
**原因：** 前端 Nginx 无法连接到后端容器

**解决：**
1. 检查后端容器是否运行：`docker-compose ps`
2. 检查容器网络：`docker network ls` 和 `docker network inspect`
3. 查看后端日志：`docker-compose logs backend`

### Q2: 404 Not Found (访问 /api/*)
**原因：** Nginx 反向代理配置错误

**解决：**
1. 验证 Nginx 配置：`docker-compose exec frontend nginx -t`
2. 检查配置文件：`docker-compose exec frontend cat /etc/nginx/conf.d/default.conf`
3. 重新构建前端镜像

### Q3: CORS 错误
**原因：** 后端 CORS 配置不正确（通常不会在 Docker Compose 部署中出现）

**解决：**
1. 检查后端环境变量 `CORS_ORIGIN`
2. 修改 `docker-compose.yml` 中的 CORS 配置
3. 重启容器：`docker-compose restart backend`

### Q4: 无限刷新
**原因：** Token 验证失败导致在登录页和 dashboard 之间循环跳转

**解决：**
1. 清除浏览器 localStorage：`localStorage.clear()`
2. 查看 Console 日志，找出哪个 API 返回 401
3. 检查 Network 标签，查看失败的请求
4. 使用 test-api.html 测试 API 连接

## 验证清单

部署后请验证以下项目：

- [ ] 所有 Docker 容器正常运行
- [ ] 访问 `http://localhost:8080` 能看到登录页
- [ ] 访问 `http://localhost:8080/test-api.html` 所有测试通过
- [ ] 浏览器 Console 能看到 API 配置日志
- [ ] 能够成功注册超级管理员
- [ ] 注册后自动登录成功
- [ ] Dashboard 页面正常加载，没有无限刷新
- [ ] 能够创建签到表、添加成员等操作
- [ ] Network 标签中所有 API 请求都是 200 状态

## 技术细节

### Nginx Proxy_Pass 路径规则

```nginx
# 情况 1：proxy_pass 不带路径（不带斜杠）
location /api/ {
    proxy_pass http://backend:10234;
}
# 请求 /api/auth/login -> 转发到 http://backend:10234/api/auth/login ✅

# 情况 2：proxy_pass 带路径（带斜杠）
location /api/ {
    proxy_pass http://backend:10234/;
}
# 请求 /api/auth/login -> 转发到 http://backend:10234/auth/login ❌
# (会丢失 /api 前缀)
```

我们的后端路由是 `/api/auth/login`，所以 Nginx 配置必须保留 `/api` 前缀。

### Docker Compose 网络

服务间通信使用服务名作为主机名：
- `http://backend:10234` - 前端访问后端
- `http://mongodb:27017` - 后端访问数据库

### Token 生命周期

1. 用户注册 → 后端创建用户
2. 自动登录 → 后端验证密码，生成 JWT Token
3. 前端保存 Token → localStorage
4. 后续请求 → 携带 Token 在 Authorization 头
5. 后端验证 Token → 允许访问受保护的 API

## 更新日期
2025-11-05
