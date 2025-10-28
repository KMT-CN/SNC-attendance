# 清空用户数据 - 用于测试首次使用功能

如果您想测试"首次使用"功能，需要清空数据库中的用户数据。

## ⭐ 推荐方法：使用 Node.js 脚本（无需额外工具）

这是最简单的方法，使用项目已有的依赖，不需要安装 MongoDB Shell。

### 1. 检查当前用户状态

```powershell
cd Backend
node check-users.js
```

这会显示：
- 当前用户数量
- 是否需要初始化
- 所有用户的详细信息

### 2. 清空所有用户

```powershell
cd Backend
node clear-users.js
```

这会：
- 显示当前用户数量
- 删除所有用户
- 显示删除结果

### 3. 验证清空成功

再次运行检查脚本：
```powershell
node check-users.js
```

应该显示"用户总数: 0"

## 方法二：使用 MongoDB Shell（需要安装 mongosh）

如果您已经安装了 MongoDB Shell：

```bash
# 连接到 MongoDB
mongosh mongodb://localhost:27017/attendance

# 删除所有用户
db.users.deleteMany({})

# 验证（应该返回 0）
db.users.countDocuments()

# 退出
exit
```

### 安装 MongoDB Shell

如果需要安装 mongosh：
- 下载地址: https://www.mongodb.com/try/download/shell
- 或使用 Chocolatey: `choco install mongodb-shell`

## 方法三：使用 MongoDB Compass（图形界面工具）

如果您安装了 MongoDB Compass：

1. 打开 MongoDB Compass
2. 连接到 `mongodb://localhost:27017`
3. 选择 `attendance` 数据库
4. 选择 `users` 集合
5. 点击顶部的"DELETE"按钮
6. 输入筛选条件：`{}`（表示所有文档）
7. 确认删除

下载 MongoDB Compass: https://www.mongodb.com/try/download/compass

## 方法四：使用 PowerShell 一键命令

1. 打开 MongoDB Compass
2. 连接到 `mongodb://localhost:27017`
3. 选择 `attendance` 数据库
4. 选择 `users` 集合
5. 点击顶部的"删除"按钮
6. 选择"删除所有文档"

## 方法四：使用 PowerShell 一键命令

在 PowerShell 中直接运行（在 Backend 目录下）：

```powershell
# 检查用户
node -e "require('dotenv').config(); const m = require('mongoose'); m.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance').then(() => m.connection.collection('users').countDocuments()).then(c => console.log('用户数量:', c)).then(() => process.exit(0));"

# 清空用户
node -e "require('dotenv').config(); const m = require('mongoose'); m.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance').then(() => m.connection.collection('users').deleteMany({})).then(r => console.log('已删除', r.deletedCount, '个用户')).then(() => process.exit(0));"
```

## 测试流程

1. **清空用户数据**
   ```powershell
   cd Backend
   node clear-users.js
   ```

2. **检查状态**（可选）
   ```powershell
   node check-users.js
   ```
   或通过 API：
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:10234/api/auth/check-setup"
   ```

3. **访问登录页面**
   - 应该自动显示注册表单
   - 看到"🎉 欢迎首次使用！"提示
   - 提示"第一个注册的用户将自动成为超级管理员"

4. **注册第一个账户**
   - 输入用户名和密码
   - 点击"创建超级管理员账户"
   - 自动登录并跳转到管理面板

5. **验证超级管理员权限**
   - 登录后应该在左侧看到"👥 用户管理"菜单
   - 可以添加其他用户

## 注意事项

⚠️ **警告**：
- 删除用户数据会导致所有账户丢失
- 在生产环境中请勿随意删除数据
- 建议在测试环境中进行
- 删除前请确保有数据备份

## 当前系统状态检查

### 方法一：使用脚本（推荐）

```powershell
cd Backend
node check-users.js
```

会显示详细信息：
- 用户总数
- 是否需要初始化
- 每个用户的详细信息（用户名、角色、创建时间等）

### 方法二：通过 API 端点

确保后端服务正在运行，然后：

```powershell
# 使用 PowerShell
Invoke-RestMethod -Uri "http://localhost:10234/api/auth/check-setup" -Method GET | ConvertTo-Json

# 或使用 curl（如果已安装）
curl http://localhost:10234/api/auth/check-setup
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

字段说明：
- `hasUsers`: 是否有用户（true/false）
- `userCount`: 当前用户数量
- `needsSetup`: 是否需要初始化设置（true 表示需要创建第一个用户）

## 快速命令参考

```powershell
# 进入后端目录
cd Backend

# 检查用户状态
node check-users.js

# 清空所有用户
node clear-users.js

# 启动后端服务
npm start

# 或使用 nodemon（开发模式）
npm run dev
```
