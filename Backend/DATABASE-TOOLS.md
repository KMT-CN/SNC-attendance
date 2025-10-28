# 数据库管理工具

本目录包含用于管理数据库的实用脚本。

## 清空用户数据

### 方法一：使用 Node.js 脚本（推荐）

这是最简单的方法，不需要安装额外的工具。

```powershell
# 进入后端目录
cd Backend

# 运行清空脚本
node clear-users.js
```

脚本会：
1. 连接到数据库
2. 显示当前用户数量
3. 删除所有用户
4. 显示删除结果

### 方法二：使用 MongoDB Compass（图形界面）

如果您安装了 MongoDB Compass：

1. 打开 MongoDB Compass
2. 连接到：`mongodb://localhost:27017`
3. 选择 `attendance` 数据库
4. 选择 `users` 集合
5. 点击"DELETE"按钮
6. 输入筛选条件：`{}` (删除所有)
7. 确认删除

### 方法三：使用 MongoDB 驱动直接操作

创建临时脚本文件：

```javascript
// temp-clear.js
const { MongoClient } = require('mongodb');

async function clear() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('attendance');
    const result = await db.collection('users').deleteMany({});
    console.log(`已删除 ${result.deletedCount} 个用户`);
    await client.close();
}

clear();
```

运行：
```powershell
node temp-clear.js
```

### 方法四：使用 PowerShell 脚本

```powershell
# 创建一个 PowerShell 脚本
@"
const { MongoClient } = require('mongodb');
(async () => {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const result = await client.db('attendance').collection('users').deleteMany({});
    console.log('删除了 ' + result.deletedCount + ' 个用户');
    await client.close();
})();
"@ | node
```

## 检查系统状态

### 使用 API 端点

```powershell
# 使用 curl（如果已安装）
curl http://localhost:10234/api/auth/check-setup

# 或者使用 PowerShell 的 Invoke-RestMethod
Invoke-RestMethod -Uri "http://localhost:10234/api/auth/check-setup" -Method GET
```

返回示例：
```json
{
  "success": true,
  "data": {
    "hasUsers": false,
    "userCount": 0,
    "needsSetup": true
  }
}
```

### 使用 Node.js 脚本

```javascript
// check-users.js
require('dotenv').config();
const mongoose = require('mongoose');

async function checkUsers() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance');
    const count = await mongoose.connection.collection('users').countDocuments();
    console.log(`用户数量: ${count}`);
    console.log(`需要初始化: ${count === 0 ? '是' : '否'}`);
    await mongoose.connection.close();
}

checkUsers();
```

## 完整重置数据库

⚠️ **危险操作** - 会删除所有数据

```powershell
cd Backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance').then(() => mongoose.connection.dropDatabase()).then(() => console.log('数据库已清空')).then(() => process.exit(0));"
```

## 备份数据库

在清空数据前，建议先备份：

```powershell
# 使用 mongodump（如果已安装）
mongodump --uri="mongodb://localhost:27017/attendance" --out=./backup

# 恢复备份
mongorestore --uri="mongodb://localhost:27017/attendance" ./backup/attendance
```

## 常见问题

### Q: 找不到 mongosh 命令
A: mongosh 是 MongoDB Shell 工具，需要单独安装。推荐使用本文档中的 Node.js 脚本方法，它使用项目已有的依赖。

### Q: 脚本运行失败
A: 确保：
1. MongoDB 服务正在运行
2. 在 Backend 目录下运行
3. .env 文件配置正确
4. 已安装 node_modules (`npm install`)

### Q: 如何确认清空成功
A: 运行 `node clear-users.js` 后，访问登录页面，应该自动显示注册表单并提示"欢迎首次使用"。

## 快速命令参考

```powershell
# 清空用户
cd Backend
node clear-users.js

# 检查状态
Invoke-RestMethod -Uri "http://localhost:10234/api/auth/check-setup"

# 启动后端
npm start
```
