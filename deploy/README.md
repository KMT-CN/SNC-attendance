# SNC 考勤系统 - 快速部署

> **⚠️ 重要提示 (v1.0.3+)**  
> 从 v1.0.3 版本开始,前端已配置 Nginx 反向代理支持。  
> 使用此 deploy 目录部署时,**必须重新拉取镜像**才能获得修复:
> ```bash
> docker-compose pull
> docker-compose up -d
> ```
> 如果遇到首次登录无法进入注册界面的问题,请确保使用最新的前端镜像 (v1.0.3+)。

## 🚀 一键部署

将此 `deploy` 文件夹复制到目标服务器,然后执行:

```bash
docker-compose up -d
```

就这么简单! 🎉

## 📋 部署要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 1GB 可用内存 (适合 J1900)
- 至少 5GB 可用磁盘空间

## 🔧 配置说明

所有配置都在 `docker-compose.yml` 文件中,查找带 🔒 🔧 🌐 emoji 的注释按需修改。

### 默认端口

- **前端**: http://localhost:8080
- **后端 API**: http://localhost:10234
- **MongoDB**: localhost:27017 (仅本地访问)

### 默认密码

- **MongoDB 用户名**: admin
- **MongoDB 密码**: snc_attendance_2025 (⚠️ 生产环境请修改)

## 📝 快速开始

```bash
# 1. 进入目录
cd deploy

# 2. (可选)修改配置
nano docker-compose.yml

# 3. 启动服务
docker-compose up -d

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

## 🛠️ 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 更新镜像并重启
docker-compose pull
docker-compose up -d

# 完全清理(⚠️ 会删除所有数据)
docker-compose down -v
```

## � 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
netstat -tuln | grep -E '8080|10234|27017'  # Linux
netstat -ano | findstr "8080 10234 27017"   # Windows
```

### MongoDB 连接失败

```bash
# 检查 MongoDB 是否健康
docker-compose ps

# 进入 MongoDB 容器测试
docker exec -it snc-attendance-mongodb mongosh \
  "mongodb://admin:snc_attendance_2025@localhost:27017/attendance?authSource=admin"
```

### 后端连接不上数据库

```bash
# 检查网络连接
docker exec snc-attendance-backend ping mongodb

# 查看后端详细日志
docker logs snc-attendance-backend -f
```

### 前端无法访问

```bash
# 检查容器状态
docker ps -a | grep frontend

# 检查 Nginx 日志
docker logs snc-attendance-frontend
```

## 📦 数据备份与恢复

### 备份

```bash
# 创建备份目录
mkdir -p backups

# 备份 MongoDB 数据
docker exec snc-attendance-mongodb mongodump \
  --username admin \
  --password snc_attendance_2025 \
  --authenticationDatabase admin \
  --db attendance \
  --out /tmp/backup

# 复制到本地
docker cp snc-attendance-mongodb:/tmp/backup ./backups/backup_$(date +%Y%m%d_%H%M%S)

# 清理容器内备份
docker exec snc-attendance-mongodb rm -rf /tmp/backup
```

### 恢复

```bash
# 复制备份到容器
docker cp ./backups/backup_20250104_120000 snc-attendance-mongodb:/tmp/restore

# 恢复数据
docker exec snc-attendance-mongodb mongorestore \
  --username admin \
  --password snc_attendance_2025 \
  --authenticationDatabase admin \
  --db attendance \
  --drop \
  /tmp/restore/attendance

# 清理
docker exec snc-attendance-mongodb rm -rf /tmp/restore
```

## 🔄 服务更新

```bash
# 拉取最新镜像
docker-compose pull

# 重新创建容器(保留数据)
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

---

**维护者**: SNC 团队  
**最后更新**: 2025年11月4日
