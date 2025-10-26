# 签到签退系统 - 前端控制面板

## 功能概述

这是一个功能完整的签到签退管理系统前端控制面板，**已集成后端 API**，支持完整的数据持久化和用户认证。

### 1. 登录界面 (`index.html`)
- ✅ 后端 JWT 身份验证
- ✅ Token 自动管理
- ✅ 表单验证
- ✅ 错误提示

**登录凭据：**
需要先通过后端 API 注册管理员账户（参考主 README.md）

### 2. 管理面板 (`dashboard.html`)

#### 签到表管理
- ✅ 创建新签到表
- ✅ 查看签到表列表
- ✅ 删除签到表
- ✅ 查看表格详情（成员数量、创建时间、状态）

#### 成员管理
- ✅ 添加成员到指定签到表
- ✅ 删除单个成员
- ✅ 批量删除成员
- ✅ 按签到表筛选成员
- ✅ 全选/取消全选功能

#### 签到记录管理
- ✅ 查看所有签到签退记录
- ✅ 记录签到日期和时间
- ✅ 记录签退日期和时间
- ✅ 手动添加/编辑签到签退记录
- ✅ 按签到表筛选记录
- ✅ 按日期筛选记录
- ✅ 显示记录状态（已完成、已签到、未签到）
- ✅ 删除签到记录

#### 系统设置
- ✅ 设置当前活动的签到/签退目标表格
- ✅ 切换签到模式/签退模式
- ✅ 导出表格数据（CSV格式）
- ⚠️ 导出为Excel格式（需要集成第三方库）

## 文件结构

```
Frontend/
├── index.html              # 登录页面
├── dashboard.html          # 管理面板
├── css/
│   └── style.css          # 样式文件
└── js/
    ├── api.js             # API 封装和配置 ⭐ 新增
    ├── login.js           # 登录逻辑（使用后端 API）
    └── dashboard.js       # 管理面板逻辑（使用后端 API）
```

## 技术栈

- **HTML5**: 页面结构
- **CSS3**: 样式和动画
- **原生JavaScript**: 交互逻辑
- **Fetch API**: HTTP 请求
- **JWT**: 身份认证

## 快速开始

### 前提条件

1. **后端服务已启动**：确保后端 Docker 服务正在运行
2. **已创建管理员账户**：通过后端 API 注册管理员

### 配置 API 地址

⚠️ **重要**：部署前必须配置后端 API 地址

编辑 `js/api.js` 文件：

```javascript
const API_CONFIG = {
    // 修改为你的后端地址
    BASE_URL: 'https://your-domain.com:443/api',
    
    // 或使用 IP 地址
    // BASE_URL: 'https://192.168.1.100:443/api',
    
    // 本地开发
    // BASE_URL: 'http://localhost:3000/api',
    
    TIMEOUT: 30000,
    TOKEN_KEY: 'attendance_token'
};
```

### 部署方式

#### 方式1：使用本地服务器（开发）

```bash
cd Frontend

# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx http-server -p 8080

# 使用 PHP
php -S localhost:8080
```

访问：`http://localhost:8080`

#### 方式2：部署到 Nginx（生产）

```bash
# 复制文件到 Web 目录
sudo cp -r Frontend/* /var/www/html/attendance/

# 配置 Nginx（示例）
sudo vim /etc/nginx/sites-available/attendance
```

Nginx 配置示例：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/attendance;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 方式3：部署到静态托管服务

- GitHub Pages
- Vercel
- Netlify
- 阿里云 OSS
- 腾讯云 COS

记得在 `js/api.js` 中配置正确的后端 API 地址！

## 使用说明

### 登录
1. 打开前端页面
2. 输入管理员用户名和密码
3. 点击登录按钮
4. 系统会自动保存 Token，无需重复登录

### 创建签到表
1. 登录后进入管理面板
2. 在"签到表管理"页面点击"创建新签到表"按钮
3. 填写表格名称和描述（可选）
4. 点击"创建"按钮

### 添加成员
1. 切换到"成员管理"页面
2. 点击"添加成员"按钮
3. 选择目标签到表
4. 填写成员信息（姓名、学号/工号、联系方式）
5. 点击"添加"按钮

### 记录签到/签退
1. 切换到"签到记录"页面
2. 点击"手动记录"按钮
3. 选择签到表和成员
4. 选择记录类型（签到或签退）
5. 设置日期和时间
6. 点击"保存记录"按钮

**注意：**
- 同一天同一成员可以有一条签到记录
- 先签到后签退，系统会自动关联
- 可以编辑已有记录
- 支持按表格和日期筛选查看

### 删除成员
**单个删除：**
- 在成员列表中点击对应成员的"删除"按钮

**批量删除：**
1. 勾选要删除的成员
2. 点击"批量删除"按钮
3. 确认操作

### 设置活动表格和模式
1. 切换到"系统设置"页面
2. 在"当前活动表格"部分选择目标表格
3. 点击"设置为活动表格"按钮
4. 在"签到/签退模式"部分选择所需模式
5. 点击"应用设置"按钮

### 导出数据
1. 切换到"系统设置"页面
2. 在"数据导出"部分选择要导出的表格
3. 点击"导出为 CSV"按钮
4. 文件将自动下载到浏览器默认下载位置

**导出内容包括：**
- 成员基本信息
- 签到日期和时间
- 签退日期和时间
- 签到状态

## 数据存储

**当前版本使用后端 API 进行数据持久化：**

- ✅ 所有数据存储在 MongoDB 数据库
- ✅ 使用 JWT Token 进行身份认证
- ✅ 数据自动同步到后端
- ✅ 支持多用户同时访问
- ✅ 数据安全可靠

**Token 存储：**
- Token 存储在浏览器 localStorage 中
- Key: `attendance_token`
- 过期时间：7天（可在后端配置）

**注意事项：**
- 清除浏览器缓存会导致需要重新登录
- Token 过期后需要重新登录
- 后端服务重启不影响前端使用

## API 集成说明

前端已完全集成后端 API，所有数据操作都通过 RESTful API 进行。

### API 配置文件 (`js/api.js`)

```javascript
// API 基础配置
const API_CONFIG = {
    BASE_URL: 'https://your-domain.com:443/api',
    TIMEOUT: 30000,
    TOKEN_KEY: 'attendance_token'
};

// API 封装类
class API {
    request(url, options)   // 通用请求方法
    get(url, params)        // GET 请求
    post(url, body)         // POST 请求
    put(url, body)          // PUT 请求
    delete(url)             // DELETE 请求
}

// 预定义的 API 接口
authAPI     // 认证相关
tableAPI    // 签到表管理
memberAPI   // 成员管理
recordAPI   // 签到记录
settingsAPI // 系统设置
```

### 使用示例

```javascript
// 登录
const response = await authAPI.login('admin', 'password');

// 获取签到表列表
const tables = await tableAPI.getAll();

// 创建成员
await memberAPI.create(tableId, name, employeeId, contact);

// 创建签到记录
await recordAPI.create(tableId, memberId, 'checkin', date, time);
```

### 错误处理

- 401 未授权：自动清除 Token 并跳转登录页
- 其他错误：显示错误提示信息
- 网络错误：提示检查网络连接

### CORS 配置

后端已配置 CORS，支持跨域请求。如果遇到跨域问题，请检查：
1. 后端 CORS 配置
2. API 地址是否正确
3. 浏览器是否允许 HTTPS 自签名证书

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 故障排查

### 无法连接后端

1. **检查 API 地址配置**
   - 打开 `js/api.js`
   - 确认 `BASE_URL` 正确

2. **检查后端服务**
   ```bash
   # 测试后端健康检查
   curl -k https://your-domain.com/health
   ```

3. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 和 Network 标签
   - 查找错误信息

4. **HTTPS 证书问题**
   - 自签名证书需要手动信任
   - 浏览器会显示"不安全"警告
   - 点击"继续访问"即可

### 登录失败

1. **确认管理员账户已创建**
   ```bash
   curl -k -X POST https://your-domain.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"yourpassword"}'
   ```

2. **检查用户名密码**
   - 注意大小写
   - 确认没有多余空格

3. **查看网络请求**
   - F12 → Network
   - 查看登录请求的响应

### Token 过期

- Token 默认 7 天过期
- 过期后需要重新登录
- 可在后端配置过期时间

### 数据不同步

1. **刷新页面**
2. **清除浏览器缓存**
3. **检查后端日志**

## 特性说明

### 响应式设计
- 支持桌面和移动设备
- 自适应布局
- 触摸友好的界面

### 用户体验
- 流畅的动画效果
- 即时的视觉反馈
- 友好的错误提示
- 确认对话框防止误操作

### 数据验证
- 必填字段验证
- 重复提交防护
- 输入格式验证

## 未来改进

- [ ] 连接后端API
- [ ] 完整的Excel导出功能
- [ ] 自动签到功能（扫码、NFC等）
- [ ] 迟到早退统计
- [ ] 签到数据可视化图表
- [ ] 消息提醒功能
- [ ] 多用户权限管理
- [ ] 数据备份和恢复
- [ ] 批量导入成员
- [ ] 考勤报表生成

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系项目维护者。
