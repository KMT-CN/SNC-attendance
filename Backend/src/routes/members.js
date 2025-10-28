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
        cardId: m.cardId,
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
        cardId: member.cardId,
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

// 绑定卡片
router.put('/:id/bind-card', [
  body('cardId').trim().notEmpty().withMessage('卡片ID不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { cardId } = req.body;
    const memberId = req.params.id;

    // 检查成员是否存在
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '成员不存在'
      });
    }

    // 检查卡片是否已被绑定
    const existingCard = await Member.findOne({ cardId, _id: { $ne: memberId } });
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: '该卡片已被其他成员绑定'
      });
    }

    // 绑定卡片
    member.cardId = cardId;
    await member.save();

    res.json({
      success: true,
      message: '卡片绑定成功',
      data: {
        id: member._id,
        name: member.name,
        employeeId: member.employeeId,
        cardId: member.cardId
      }
    });
  } catch (error) {
    console.error('Bind card error:', error);
    res.status(500).json({
      success: false,
      message: '绑定卡片失败'
    });
  }
});

// 解绑卡片
router.put('/:id/unbind-card', async (req, res) => {
  try {
    const memberId = req.params.id;

    // 检查成员是否存在
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '成员不存在'
      });
    }

    // 解绑卡片
    member.cardId = '';
    await member.save();

    res.json({
      success: true,
      message: '卡片解绑成功',
      data: {
        id: member._id,
        name: member.name,
        employeeId: member.employeeId,
        cardId: member.cardId
      }
    });
  } catch (error) {
    console.error('Unbind card error:', error);
    res.status(500).json({
      success: false,
      message: '解绑卡片失败'
    });
  }
});

// 根据卡片ID查询成员
router.get('/by-card/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;

    const member = await Member.findOne({ cardId });
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '未找到绑定此卡片的成员'
      });
    }

    res.json({
      success: true,
      data: {
        id: member._id,
        tableId: member.tableId,
        name: member.name,
        employeeId: member.employeeId,
        contact: member.contact,
        cardId: member.cardId,
        joinedAt: member.joinedAt
      }
    });
  } catch (error) {
    console.error('Get member by card error:', error);
    res.status(500).json({
      success: false,
      message: '查询成员失败'
    });
  }
});

module.exports = router;
