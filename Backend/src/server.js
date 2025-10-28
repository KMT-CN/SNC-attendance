const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tableRoutes = require('./routes/tables');
const memberRoutes = require('./routes/members');
const recordRoutes = require('./routes/records');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));


// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 连接成功');
})
.catch((err) => {
  console.error('❌ MongoDB 连接失败:', err);
  process.exit(1);
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
});

// 启动服务器 - 只监听 127.0.0.1
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 服务器启动成功: http://127.0.0.1:${PORT}`);
  console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚠️  后端只监听本地，请配置反向代理（Nginx/Caddy/Cloudflare Tunnel）对外提供服务`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  mongoose.connection.close(() => {
    console.log('MongoDB 连接已关闭');
    process.exit(0);
  });
});
