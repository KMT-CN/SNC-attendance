const User = require('../models/User');

// 检查是否为管理员（admin 或 superadmin）
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  }

  next();
};

// 检查是否为超级管理员
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '未认证'
    });
  }

  if (req.user.role !== 'superadmin' || !req.user.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: '权限不足，需要超级管理员权限'
    });
  }

  next();
};

// 检查是否有用户管理权限（只有超级管理员可以管理用户）
const canManageUsers = (req, res, next) => {
  return requireSuperAdmin(req, res, next);
};

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  canManageUsers
};
