# 读卡器功能使用说明

## 功能概述

本系统已集成读卡器功能，支持通过串口读卡器进行人员签到签退。主要功能包括：

1. **读卡器连接管理** - 通过 Web Serial API 连接串口读卡器
2. **卡片绑定** - 将卡片ID与系统成员关联
3. **刷卡签到/签退** - 自动识别卡片并完成签到签退操作

## 功能实现

### 后端修改

#### 1. Member 模型更新 (`Backend/src/models/Member.js`)
- 添加 `cardId` 字段用于存储卡片ID
- 添加唯一索引确保一张卡片只能绑定一个成员

#### 2. Members 路由扩展 (`Backend/src/routes/members.js`)
新增以下 API 端点：

- **POST `/api/members/:id/bind-card`** - 绑定卡片
  ```json
  Request: { "cardId": "卡片ID" }
  ```

- **PUT `/api/members/:id/unbind-card`** - 解绑卡片

- **GET `/api/members/by-card/:cardId`** - 根据卡片ID查询成员

#### 3. Records 路由扩展 (`Backend/src/routes/records.js`)
新增 API 端点：

- **POST `/api/records/card-checkin`** - 刷卡签到/签退
  ```json
  Request: {
    "cardId": "卡片ID",
    "tableId": "签到表ID",
    "recordType": "checkin|checkout"
  }
  ```

### 前端实现

#### 1. 读卡器管理页面 (`Frontend/card-reader.html`)
功能：
- 显示读卡器连接状态
- 显示当前活动签到表和模式
- 实时显示刷卡结果
- 操作日志记录

#### 2. 读卡器管理模块 (`Frontend/js/cardReader.js`)
核心功能：
- 使用 Web Serial API 连接串口读卡器
- 实时读取卡片数据
- 自动调用后端API进行签到签退
- 显示操作结果和日志

#### 3. Dashboard 更新 (`Frontend/dashboard.html` + `Frontend/js/dashboard.js`)
- 侧边栏添加"读卡器管理"入口
- 成员列表添加"卡片状态"列
- 添加"绑定卡片"和"解绑卡片"功能
- 新增卡片绑定模态框

#### 4. API 模块更新 (`Frontend/js/api.js`)
扩展 memberAPI 和 recordAPI：
- `memberAPI.bindCard(memberId, cardId)` - 绑定卡片
- `memberAPI.unbindCard(memberId)` - 解绑卡片
- `memberAPI.getByCard(cardId)` - 查询绑定成员
- `recordAPI.cardCheckin(cardId, tableId, recordType)` - 刷卡签到

## 使用流程

### 1. 准备工作

**浏览器要求：**
- Google Chrome 89+
- Microsoft Edge 89+
- Opera 76+

**读卡器要求：**
- 支持串口通信的读卡器
- 默认配置：波特率 9600, 8位数据位, 1位停止位, 无奇偶校验
- 如需调整参数，修改 `cardReader.js` 中的 `connect()` 方法

### 2. 绑定卡片

1. 登录管理面板
2. 进入"成员管理"页面
3. 找到需要绑定卡片的成员
4. 点击"绑定卡片"按钮
5. 输入卡片ID（或在读卡器页面获取）
6. 点击"绑定"完成

**获取卡片ID方式：**
- 方式1：在读卡器管理页面连接读卡器后刷卡，从日志中复制卡片ID
- 方式2：通过读卡器测试软件获取卡片ID

### 3. 使用读卡器签到

1. 在"系统设置"中：
   - 设置"当前活动表格"
   - 选择"签到模式"或"签退模式"
   - 点击"应用设置"

2. 进入"读卡器管理"页面

3. 点击"连接读卡器"按钮
   - 浏览器会弹出串口选择对话框
   - 选择对应的串口设备
   - 授权访问权限

4. 连接成功后：
   - 状态指示灯变为绿色并闪烁
   - 显示"读卡器已连接"
   - 显示当前活动表格和模式

5. 刷卡操作：
   - 将卡片靠近读卡器
   - 系统自动读取卡片ID
   - 自动匹配成员信息
   - 完成签到/签退记录
   - 显示操作结果（成功/失败）

6. 查看结果：
   - 页面中央显示成员信息和操作结果
   - 操作日志记录所有操作历史
   - 可在"签到记录"页面查看完整记录

### 4. 切换签到/签退模式

1. 返回管理面板
2. 进入"系统设置"
3. 在"签到/签退模式"中选择：
   - **签到模式**：用于记录签到时间
   - **签退模式**：用于记录签退时间
4. 点击"应用设置"
5. 返回读卡器管理页面，模式会自动更新

## 常见问题

### 1. 浏览器提示不支持 Web Serial API
**解决方案：**
- 更新浏览器到最新版本
- 使用 Chrome、Edge 或 Opera 浏览器
- 确保使用 HTTPS 或 localhost

### 2. 连接读卡器失败
**可能原因：**
- 读卡器未正确连接到电脑
- 串口被其他程序占用
- 波特率等参数不匹配

**解决方案：**
- 检查读卡器物理连接
- 关闭其他可能占用串口的程序
- 调整 `cardReader.js` 中的连接参数

### 3. 刷卡无反应
**可能原因：**
- 未设置活动签到表
- 卡片未绑定成员
- 读卡器连接断开

**解决方案：**
- 在系统设置中设置活动签到表
- 确认卡片已绑定到成员
- 重新连接读卡器

### 4. 提示"该卡片已被其他成员绑定"
**解决方案：**
- 一张卡片只能绑定一个成员
- 先解绑原成员的卡片，再绑定新成员

### 5. 卡片ID读取不正确
**可能原因：**
- 读卡器数据格式与代码解析不匹配

**解决方案：**
- 修改 `cardReader.js` 中的 `handleCardData()` 方法
- 根据实际读卡器返回的数据格式调整解析逻辑

## 技术细节

### Web Serial API 使用

```javascript
// 请求串口访问
const port = await navigator.serial.requestPort();

// 打开串口连接
await port.open({
    baudRate: 9600,    // 波特率
    dataBits: 8,       // 数据位
    stopBits: 1,       // 停止位
    parity: 'none'     // 奇偶校验
});

// 读取数据
const reader = port.readable.getReader();
while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    // 处理数据
    handleCardData(value);
}
```

### 数据流程

```
读卡器 -> 串口 -> Web Serial API -> cardReader.js
    -> 解析卡片ID -> 调用后端API -> 验证并记录
    -> 返回结果 -> 更新界面显示
```

### 安全性考虑

1. **卡片ID唯一性**：数据库索引确保一张卡片只能绑定一个成员
2. **权限验证**：所有API需要登录token验证
3. **表格验证**：签到时验证成员是否属于当前签到表
4. **重复签到处理**：同一天重复签到会更新时间，不会创建新记录

## 自定义配置

### 修改读卡器参数

编辑 `Frontend/js/cardReader.js`：

```javascript
await this.port.open({
    baudRate: 9600,    // 修改为你的读卡器波特率
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
});
```

### 修改数据解析逻辑

编辑 `handleCardData()` 方法：

```javascript
async handleCardData(data) {
    const decoder = new TextDecoder();
    let cardId = decoder.decode(data).trim();
    
    // 根据实际读卡器格式调整解析逻辑
    cardId = cardId.replace(/[\r\n\x00]/g, '');
    
    // 你的自定义解析逻辑
    // ...
}
```

## 维护建议

1. **定期检查读卡器连接**：建议每次使用前检查连接状态
2. **日志监控**：通过操作日志排查问题
3. **数据备份**：定期导出签到记录
4. **卡片管理**：建议为每张卡片做好标识和记录

## 支持与反馈

如遇到问题或有改进建议，请通过以下方式反馈：
- 项目 Issues
- 技术支持邮箱
- 系统管理员

---

**版本：** 1.0  
**更新日期：** 2025年10月27日
