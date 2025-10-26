const express = require('express');
const { body, validationResult } = require('express-validator');
const Member = require('../models/Member');
const Table = require('../models/Table');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取成员列表
router.get('/', async (req, res) => {
  try {
    const { tableId } = req.query;
    
    const query = tableId ? { tableId } : {};
    const members = await Member.find(query).sort({ joinedAt: -1 });

    res.json({
      success: true,
      data: members.map(m => ({
        id: m._id,
        tableId: m.tableId,
        name: m.name,
        employeeId: m.employeeId,
        contact: m.contact,
        joinedAt: m.joinedAt
      }))
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: '获取成员列表失败'
    });
  }
});

// 添加成员
router.post('/', [
  body('tableId').notEmpty().withMessage('签到表ID不能为空'),
  body('name').trim().notEmpty().withMessage('姓名不能为空'),
  body('employeeId').trim().notEmpty().withMessage('学号/工号不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { tableId, name, employeeId, contact } = req.body;

    // 验证签到表是否存在
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: '签到表不存在'
      });
    }

    // 检查是否已存在相同的成员
    const existingMember = await Member.findOne({ tableId, employeeId });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: '该学号/工号已存在'
      });
    }

    const member = new Member({
      tableId,
      name,
      employeeId,
      contact: contact || ''
    });

    await member.save();

    res.status(201).json({
      success: true,
      message: '成员添加成功',
      data: {
        id: member._id,
        tableId: member.tableId,
        name: member.name,
        employeeId: member.employeeId,
        contact: member.contact,
        joinedAt: member.joinedAt
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: '添加成员失败'
    });
  }
});

// 删除成员
router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '成员不存在'
      });
    }

    await member.deleteOne();

    res.json({
      success: true,
      message: '成员删除成功'
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      success: false,
      message: '删除成员失败'
    });
  }
});

// 批量删除成员
router.post('/batch-delete', [
  body('ids').isArray().withMessage('ids 必须是数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { ids } = req.body;

    await Member.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: '批量删除成功'
    });
  } catch (error) {
    console.error('Batch delete members error:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败'
    });
  }
});

module.exports = router;
