const express = require('express');
const { body, validationResult } = require('express-validator');
const Table = require('../models/Table');
const Member = require('../models/Member');
const Record = require('../models/Record');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有签到表
router.get('/', async (req, res) => {
  try {
    const { userGroup: queryUserGroup } = req.query;
    const { isSuperAdmin, userGroup } = req.user;

    const filter = {};

    if (isSuperAdmin) {
      // 超级管理员可以查看所有，或按指定用户组筛选
      if (queryUserGroup) {
        filter.userGroup = queryUserGroup;
      }
    } else {
      // 普通用户和管理员只能查看自己用户组的
      filter.userGroup = userGroup;
    }

    const tables = await Table.find(filter).sort({ createdAt: -1 });
    
    // 获取每个表格的成员数量
    const tablesWithCount = await Promise.all(
      tables.map(async (table) => {
        const memberCount = await Member.countDocuments({ tableId: table._id });
        return {
          id: table._id,
          name: table.name,
          description: table.description,
          status: table.status,
          createdAt: table.createdAt,
          memberCount
        };
      })
    );

    res.json({
      success: true,
      data: tablesWithCount
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: '获取签到表失败'
    });
  }
});

// 创建签到表
router.post('/', [
  body('name').trim().notEmpty().withMessage('表格名称不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { name, description } = req.body;
    const { userGroup } = req.user;

    const table = new Table({
      name,
      description: description || '',
      userGroup: userGroup
    });

    await table.save();

    res.status(201).json({
      success: true,
      message: '签到表创建成功',
      data: {
        id: table._id,
        name: table.name,
        description: table.description,
        status: table.status,
        createdAt: table.createdAt
      }
    });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({
      success: false,
      message: '创建签到表失败'
    });
  }
});

// 获取单个签到表
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: '签到表不存在'
      });
    }

    const memberCount = await Member.countDocuments({ tableId: table._id });

    res.json({
      success: true,
      data: {
        id: table._id,
        name: table.name,
        description: table.description,
        status: table.status,
        createdAt: table.createdAt,
        memberCount
      }
    });
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({
      success: false,
      message: '获取签到表失败'
    });
  }
});

// 删除签到表
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: '签到表不存在'
      });
    }

    // 删除相关成员和记录
    await Member.deleteMany({ tableId: table._id });
    await Record.deleteMany({ tableId: table._id });
    await table.deleteOne();

    res.json({
      success: true,
      message: '签到表删除成功'
    });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: '删除签到表失败'
    });
  }
});

module.exports = router;
