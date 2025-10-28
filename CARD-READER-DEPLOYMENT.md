# 读卡器功能更新部署说明

## 更新内容概述

本次更新为签到签退系统添加了完整的读卡器功能，包括：
- ✅ 后端API支持卡片绑定和刷卡签到
- ✅ 前端读卡器管理界面
- ✅ Web Serial API 串口通信
- ✅ 成员卡片绑定管理

## 文件变更清单

### 后端 (Backend/)

**修改的文件：**
1. `src/models/Member.js` - 添加 cardId 字段
2. `src/routes/members.js` - 新增卡片绑定API
3. `src/routes/records.js` - 新增刷卡签到API

**新增API端点：**
- `PUT /api/members/:id/bind-card` - 绑定卡片
- `PUT /api/members/:id/unbind-card` - 解绑卡片
- `GET /api/members/by-card/:cardId` - 根据卡片ID查询成员
- `POST /api/records/card-checkin` - 刷卡签到/签退

### 前端 (Frontend/)

**新增文件：**
1. `card-reader.html` - 读卡器管理页面
2. `js/cardReader.js` - 读卡器逻辑模块

**修改的文件：**
1. `dashboard.html` - 添加读卡器入口和卡片绑定界面
2. `js/dashboard.js` - 添加卡片管理功能
3. `js/api.js` - 扩展API方法（已包含）

**文档文件：**
1. `CARD-READER-GUIDE.md` - 使用说明文档

## 部署步骤

### 1. 备份数据库（重要！）

```bash
# 备份 MongoDB 数据
mongodump --db attendance --out backup_$(date +%Y%m%d)
```

### 2. 更新后端代码

```bash
cd Backend

# 拉取最新代码
git pull origin main

# 无需安装新依赖，使用现有的 express-validator 和 mongoose

# 重启后端服务（根据你的部署方式选择）

# 如果使用 PM2：
pm2 restart attendance-backend

# 如果使用 Docker：
docker-compose restart backend

# 如果直接运行：
# 停止旧进程，然后
node src/server.js
```

### 3. 更新前端文件

```bash
cd Frontend

# 拉取最新代码
git pull origin main

# 前端是静态文件，无需编译
# 如果使用 Nginx，刷新配置：
nginx -s reload

# 如果使用其他 Web 服务器，重启相应服务
```

### 4. 数据库迁移（自动）

MongoDB 会自动处理新字段：
- 现有成员的 `cardId` 字段默认为空字符串
- 新成员会包含 `cardId` 字段
- 唯一索引会自动创建

**验证索引：**
```javascript
// 连接到 MongoDB
use attendance

// 查看 members 集合的索引
db.members.getIndexes()

// 应该看到包含 cardId 的索引：
// { "v": 2, "key": { "cardId": 1 }, "name": "cardId_1", "sparse": true, "unique": true }
```

### 5. 测试功能

**后端API测试：**

```bash
# 1. 绑定卡片
curl -X PUT http://localhost:10234/api/members/[成员ID]/bind-card \
  -H "Authorization: Bearer [你的token]" \
  -H "Content-Type: application/json" \
  -d '{"cardId": "TEST001"}'

# 2. 查询卡片绑定的成员
curl -X GET http://localhost:10234/api/members/by-card/TEST001 \
  -H "Authorization: Bearer [你的token]"

# 3. 测试刷卡签到
curl -X POST http://localhost:10234/api/records/card-checkin \
  -H "Authorization: Bearer [你的token]" \
  -H "Content-Type: application/json" \
  -d '{
    "cardId": "TEST001",
    "tableId": "[签到表ID]",
    "recordType": "checkin"
  }'
```

**前端功能测试：**

1. 访问管理面板
2. 进入"成员管理"
   - 确认成员列表显示"卡片状态"列
   - 确认有"绑定卡片"按钮
3. 测试绑定卡片功能
4. 访问"读卡器管理"页面（需要支持的浏览器）
5. 测试连接读卡器（需要实际硬件）

## 浏览器要求

读卡器功能需要支持 Web Serial API 的浏览器：
- ✅ Google Chrome 89+
- ✅ Microsoft Edge 89+
- ✅ Opera 76+
- ❌ Firefox（不支持）
- ❌ Safari（不支持）

**HTTPS 要求：**
- 生产环境必须使用 HTTPS
- 本地开发可以使用 localhost

## 配置检查清单

### 后端配置

- [ ] MongoDB 连接正常
- [ ] 后端服务运行在 127.0.0.1:10234
- [ ] 认证中间件正常工作
- [ ] 新增API端点可访问

### 前端配置

- [ ] `js/api.js` 中 `BASE_URL` 配置正确
- [ ] 可以正常访问 `card-reader.html`
- [ ] 浏览器版本符合要求
- [ ] HTTPS 配置正确（生产环境）

### 读卡器配置

- [ ] 读卡器驱动已安装
- [ ] 串口通信参数匹配（波特率等）
- [ ] 操作系统授予浏览器串口访问权限

## 回滚方案

如果部署后出现问题，可以快速回滚：

### 回滚后端

```bash
cd Backend

# 切换到上一个版本
git checkout [上一个commit]

# 重启服务
pm2 restart attendance-backend
# 或
docker-compose restart backend
```

### 回滚前端

```bash
cd Frontend

# 切换到上一个版本
git checkout [上一个commit]

# 刷新 Web 服务器
nginx -s reload
```

### 数据库回滚

```bash
# 如果需要删除 cardId 字段和索引
mongo attendance

db.members.updateMany({}, { $unset: { cardId: "" } })
db.members.dropIndex("cardId_1")
```

## 故障排查

### 问题1：后端启动失败

**症状：** 服务启动报错或无法访问API

**检查：**
```bash
# 查看日志
pm2 logs attendance-backend

# 检查端口占用
netstat -an | grep 10234

# 验证 MongoDB 连接
mongo --eval "db.adminCommand('ping')"
```

### 问题2：前端无法绑定卡片

**症状：** 点击绑定卡片按钮无反应或报错

**检查：**
1. 浏览器控制台是否有JavaScript错误
2. 网络请求是否成功（F12 -> Network）
3. API响应状态码和内容
4. token是否有效

### 问题3：读卡器无法连接

**症状：** 点击连接读卡器后无反应

**检查：**
1. 浏览器是否支持 Web Serial API
2. 是否使用 HTTPS 或 localhost
3. 读卡器硬件是否连接
4. 串口是否被其他程序占用

### 问题4：刷卡无反应

**症状：** 刷卡后没有任何反应

**检查：**
1. 读卡器连接状态
2. 系统设置中是否设置了活动签到表
3. 卡片是否已绑定成员
4. 查看读卡器页面的操作日志

## 性能影响评估

- **数据库：** cardId 字段添加，几乎无性能影响
- **后端API：** 新增3个端点，对现有API无影响
- **前端：** 新增页面和功能，不影响原有功能性能
- **带宽：** Web Serial API 本地通信，不增加网络流量

## 安全性说明

1. **卡片ID唯一性：** 数据库索引保证
2. **API认证：** 所有新API都需要token验证
3. **权限控制：** 继承现有的认证机制
4. **数据验证：** 使用 express-validator 验证输入

## 后续优化建议

1. **读卡器驱动适配：** 根据实际硬件调整通信参数
2. **卡片格式支持：** 扩展支持更多卡片类型
3. **批量绑定：** 添加批量绑定卡片功能
4. **统计报表：** 添加刷卡统计和分析
5. **离线模式：** 支持离线缓存刷卡记录

## 联系支持

如遇到部署问题，请提供以下信息：
- 操作系统和版本
- Node.js 版本
- MongoDB 版本
- 浏览器版本
- 错误日志和截图

---

**部署完成后，请阅读 `CARD-READER-GUIDE.md` 了解详细使用方法！**
