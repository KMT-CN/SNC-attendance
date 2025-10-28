const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { canManageUsers } = require('../middleware/permission');

const router = express.Router();

// 所有路由都需要认证和超级管理员权限
router.use(authMiddleware);
router.use(canManageUsers);

// 获取所有用户列表
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 获取单个用户信息
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 创建新用户
router.post('/', [
  body('username').trim().notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
  body('role').isIn(['user', 'admin', 'superadmin']).withMessage('角色不合法')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, password, role } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }

    // 只有超级管理员可以创建其他超级管理员
    if (role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: '不能通过此接口创建超级管理员'
      });
    }

    // 创建用户
    const user = new User({
      username,
      password,
      role,
      isSuperAdmin: false,
      createdBy: req.user.userId
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败'
    });
  }
});

// 更新用户信息（不包括密码）
router.put('/:id', [
  body('username').optional().trim().notEmpty().withMessage('用户名不能为空'),
  body('role').optional().isIn(['user', 'admin', 'superadmin']).withMessage('角色不合法')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { username, role } = req.body;
    const userId = req.params.id;

    // 不能修改自己的账户
    if (userId === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能修改自己的账户，请联系其他管理员'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能修改超级管理员的角色
    if (user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: '不能修改超级管理员的信息'
      });
    }

    // 不能将用户提升为超级管理员
    if (role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: '不能将用户设置为超级管理员'
      });
    }

    // 检查新用户名是否已存在
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }
      user.username = username;
    }

    if (role) {
      user.role = role;
    }

    user.updatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

// 修改用户密码
router.put('/:id/password', [
  body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { newPassword } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能修改超级管理员的密码
    if (user.isSuperAdmin && userId !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '不能修改超级管理员的密码'
      });
    }

    user.password = newPassword;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // 不能删除自己
    if (userId === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不能删除超级管理员
    if (user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: '不能删除超级管理员账户'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
});

// 批量删除用户
router.post('/batch-delete', [
  body('userIds').isArray().withMessage('用户ID列表必须是数组'),
  body('userIds.*').isMongoId().withMessage('无效的用户ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { userIds } = req.body;

    // 不能删除自己
    if (userIds.includes(req.user.userId.toString())) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    // 检查是否包含超级管理员
    const users = await User.find({ _id: { $in: userIds } });
    const hasSuperAdmin = users.some(user => user.isSuperAdmin);
    
    if (hasSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: '不能删除超级管理员账户'
      });
    }

    const result = await User.deleteMany({
      _id: { $in: userIds },
      isSuperAdmin: false
    });

    res.json({
      success: true,
      message: `成功删除 ${result.deletedCount} 个用户`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error('Batch delete users error:', error);
    res.status(500).json({
      success: false,
      message: '批量删除用户失败'
    });
  }
});

module.exports = router;
