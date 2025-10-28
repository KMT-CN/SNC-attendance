const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// 检查系统是否有用户（用于判断是否首次使用）
router.get('/check-setup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      success: true,
      data: {
        hasUsers: userCount > 0,
        userCount: userCount,
        needsSetup: userCount === 0
      }
    });
  } catch (error) {
    console.error('Check setup error:', error);
    res.status(500).json({
      success: false,
      message: '检查系统状态失败'
    });
  }
});

// 登录
router.post('/login', [
  body('username').trim().notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, password } = req.body;

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, isSuperAdmin: user.isSuperAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

// 注册（仅允许创建第一个超级管理员账户）
router.post('/register', [
  body('username').trim().notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, password } = req.body;

    // 检查是否是第一个用户
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // 如果已有用户，禁止通过注册接口创建新用户
    if (!isFirstUser) {
      return res.status(403).json({
        success: false,
        message: '系统已完成初始化设置，新用户请联系超级管理员在用户管理中添加'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 创建第一个用户（超级管理员）
    const user = new User({
      username,
      password,
      role: 'superadmin',
      isSuperAdmin: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: '注册成功！您已成为超级管理员',
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

module.exports = router;
