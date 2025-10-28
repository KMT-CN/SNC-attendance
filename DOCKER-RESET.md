# Docker 部署重置指南

本文档说明如何在 Docker 部署中重置系统。

## 🔄 重置选项

### 选项1：仅重置数据（推荐用于测试）

**保留**：配置文件（.env）、Docker镜像  
**删除**：所有数据库数据

适用场景：
- 测试首次注册功能
- 清空用户数据重新开始
- 保留配置但重置数据

#### Windows (PowerShell)
```powershell
.\reset-data.ps1
```

#### Linux/Mac
```bash
chmod +x reset-data.sh
./reset-data.sh
```

### 选项2：完全重置（重新开始）

**删除**：所有容器、卷、镜像、配置文件

适用场景：
- 完全重新部署
- 更改配置需要重建
- 清理所有 Docker 资源

#### Windows (PowerShell)
```powershell
.\reset.ps1
```

#### Linux/Mac
```bash
chmod +x reset.sh
./reset.sh
```

## 📝 详细说明

### 仅重置数据 (reset-data)

执行步骤：
1. 停止所有 Docker 容器
2. 删除容器和数据卷（`docker compose down -v`）
3. 重新启动服务
4. 数据库为空，可以注册第一个超级管理员

**保留内容**：
- `.env` 配置文件
- Docker 镜像（无需重新构建）
- 网络配置

**执行时间**：约 10-20 秒

### 完全重置 (reset)

执行步骤：
1. 停止所有 Docker 容器
2. 删除容器、卷和网络
3. 删除所有相关 Docker 镜像
4. 删除 `.env` 配置文件
5. 清理 Docker 系统

**删除内容**：
- 所有数据
- 所有配置
- 所有 Docker 资源

**执行时间**：约 30-60 秒

之后需要：
```powershell
# 重新部署
.\deploy.ps1
```

## ⚠️ 安全提示

### 确认提示

所有重置脚本都需要输入 `YES` 确认：

```
Type 'YES' to continue with data reset: YES
```

- 只有准确输入 `YES`（大写）才会继续
- 其他任何输入都会取消操作

### 数据备份

**重要**：重置前请确保：

1. **生产环境必须备份**
   ```bash
   # 备份 MongoDB 数据
   docker compose exec mongodb mongodump --out=/dump/backup-$(date +%Y%m%d)
   
   # 复制备份到本地
   docker cp attendance-mongodb:/dump ./mongodb-backup
   ```

2. **保存配置文件**
   ```bash
   # 备份 .env
   cp Backend/.env Backend/.env.backup
   ```

3. **导出用户列表**
   ```bash
   cd Backend
   node check-users.js > users-backup.txt
   ```

## 🔍 验证重置成功

### 检查 Docker 资源

```powershell
# 查看运行的容器
docker compose ps

# 查看卷
docker volume ls

# 查看镜像
docker images
```

### 检查数据库状态

```powershell
cd Backend
node check-users.js
```

应显示：
```
用户总数: 0
需要初始化: 是 ✅
```

### 访问系统

1. 打开浏览器访问登录页面
2. 应该看到注册表单
3. 显示"🎉 欢迎首次使用！"

## 🚀 重置后的部署流程

### 仅重置数据后

数据已清空，但系统仍在运行：

1. ✅ 访问登录页面
2. ✅ 注册第一个超级管理员
3. ✅ 开始使用

### 完全重置后

需要重新部署：

```powershell
# 1. 重新部署
.\deploy.ps1

# 2. 等待服务启动（约30秒）

# 3. 访问登录页面
# 4. 注册第一个超级管理员
```

## 📋 常见问题

### Q: 重置后无法访问系统？

A: 等待服务完全启动（30-60秒），然后检查：
```powershell
# 查看日志
cd Backend
docker compose logs -f
```

### Q: 想保留某些数据怎么办？

A: 重置前先备份：
```powershell
# 导出用户数据
node check-users.js > backup.txt

# 或手动记录重要信息
```

### Q: 重置后 .env 文件消失？

A: 
- `reset-data.ps1` 不会删除 .env
- `reset.ps1` 会删除 .env，需要重新运行 `deploy.ps1`

### Q: Docker 磁盘空间不足？

A: 使用完全重置清理所有资源：
```powershell
.\reset.ps1

# 或手动清理
docker system prune -a --volumes
```

### Q: 如何只重置用户数据但保留其他数据？

A: 使用 Node.js 脚本（不需要重启 Docker）：
```powershell
cd Backend
node clear-users.js
```

## 🛠️ 手动重置命令

如果脚本无法使用，可以手动执行：

### 仅重置数据
```powershell
cd Backend
docker compose down -v
docker compose up -d
```

### 完全重置
```powershell
cd Backend
docker compose down -v --remove-orphans
docker rmi $(docker images -q 'attendance-backend*')
Remove-Item .env
docker system prune -f
```

## 📊 重置对比表

| 操作 | reset-data | reset | clear-users.js |
|------|-----------|-------|----------------|
| 停止服务 | ✅ | ✅ | ❌ |
| 删除数据 | ✅ | ✅ | ✅ |
| 删除配置 | ❌ | ✅ | ❌ |
| 删除镜像 | ❌ | ✅ | ❌ |
| 需要重启 | ✅ 自动 | ❌ 需手动 | ❌ |
| 执行时间 | ~15秒 | ~45秒 | ~2秒 |
| 推荐场景 | 测试首次使用 | 完全重新开始 | 快速清空用户 |

## 🎯 最佳实践

1. **开发测试**：使用 `node clear-users.js`（最快）
2. **Docker 测试**：使用 `reset-data.ps1`（保留配置）
3. **完全重建**：使用 `reset.ps1`（彻底清理）
4. **生产环境**：谨慎使用，必须先备份

## 📞 支持

如果遇到问题：
1. 查看日志：`docker compose logs -f`
2. 检查状态：`docker compose ps`
3. 手动清理：参考"手动重置命令"部分
