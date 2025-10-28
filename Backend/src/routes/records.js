const express = require('express');
const { body, validationResult } = require('express-validator');
const Record = require('../models/Record');
const Member = require('../models/Member');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取签到记录
router.get('/', async (req, res) => {
  try {
    const { tableId, date, memberId } = req.query;
    
    const query = {};
    if (tableId) query.tableId = tableId;
    if (memberId) query.memberId = memberId;
    if (date) {
      query.$or = [
        { checkinDate: date },
        { checkoutDate: date }
      ];
    }

    const records = await Record.find(query)
      .populate('memberId', 'name employeeId')
      .sort({ checkinDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: records.map(r => ({
        id: r._id,
        tableId: r.tableId,
        memberId: r.memberId._id,
        memberName: r.memberId.name,
        memberEmployeeId: r.memberId.employeeId,
        checkinDate: r.checkinDate,
        checkinTime: r.checkinTime,
        checkoutDate: r.checkoutDate,
        checkoutTime: r.checkoutTime,
        status: r.status,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({
      success: false,
      message: '获取签到记录失败'
    });
  }
});

// 创建/更新签到记录
router.post('/', [
  body('tableId').notEmpty().withMessage('签到表ID不能为空'),
  body('memberId').notEmpty().withMessage('成员ID不能为空'),
  body('recordType').isIn(['checkin', 'checkout']).withMessage('记录类型无效'),
  body('date').notEmpty().withMessage('日期不能为空'),
  body('time').notEmpty().withMessage('时间不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { tableId, memberId, recordType, date, time } = req.body;

    // 验证成员是否存在
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '成员不存在'
      });
    }

    // 查找当天是否已有记录
    let record = await Record.findOne({
      tableId,
      memberId,
      checkinDate: date
    });

    if (recordType === 'checkin') {
      if (record) {
        // 更新签到时间
        record.checkinDate = date;
        record.checkinTime = time;
      } else {
        // 创建新记录
        record = new Record({
          tableId,
          memberId,
          checkinDate: date,
          checkinTime: time
        });
      }
    } else if (recordType === 'checkout') {
      if (record) {
        // 更新签退时间
        record.checkoutDate = date;
        record.checkoutTime = time;
      } else {
        // 创建只有签退的记录
        record = new Record({
          tableId,
          memberId,
          checkoutDate: date,
          checkoutTime: time
        });
      }
    }

    await record.save();

    res.status(201).json({
      success: true,
      message: `${recordType === 'checkin' ? '签到' : '签退'}记录保存成功`,
      data: {
        id: record._id,
        tableId: record.tableId,
        memberId: record.memberId,
        checkinDate: record.checkinDate,
        checkinTime: record.checkinTime,
        checkoutDate: record.checkoutDate,
        checkoutTime: record.checkoutTime,
        status: record.status
      }
    });
  } catch (error) {
    console.error('Create/Update record error:', error);
    res.status(500).json({
      success: false,
      message: '保存记录失败'
    });
  }
});

// 更新签到记录
router.put('/:id', async (req, res) => {
  try {
    const { checkinDate, checkinTime, checkoutDate, checkoutTime } = req.body;

    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    if (checkinDate !== undefined) record.checkinDate = checkinDate;
    if (checkinTime !== undefined) record.checkinTime = checkinTime;
    if (checkoutDate !== undefined) record.checkoutDate = checkoutDate;
    if (checkoutTime !== undefined) record.checkoutTime = checkoutTime;

    await record.save();

    res.json({
      success: true,
      message: '记录更新成功',
      data: {
        id: record._id,
        tableId: record.tableId,
        memberId: record.memberId,
        checkinDate: record.checkinDate,
        checkinTime: record.checkinTime,
        checkoutDate: record.checkoutDate,
        checkoutTime: record.checkoutTime,
        status: record.status
      }
    });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({
      success: false,
      message: '更新记录失败'
    });
  }
});

// 删除签到记录
router.delete('/:id', async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    await record.deleteOne();

    res.json({
      success: true,
      message: '记录删除成功'
    });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({
      success: false,
      message: '删除记录失败'
    });
  }
});

// 刷卡签到/签退
router.post('/card-checkin', [
  body('cardId').trim().notEmpty().withMessage('卡片ID不能为空'),
  body('tableId').notEmpty().withMessage('签到表ID不能为空'),
  body('recordType').isIn(['checkin', 'checkout']).withMessage('记录类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { cardId, tableId, recordType } = req.body;
    
    // 根据卡片ID查找成员
    const member = await Member.findOne({ cardId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '未找到绑定此卡片的成员'
      });
    }

    // 检查成员是否属于该签到表
    if (member.tableId.toString() !== tableId) {
      return res.status(400).json({
        success: false,
        message: '该成员不属于当前签到表'
      });
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5);

    // 查找当天是否已有记录
    let record = await Record.findOne({
      tableId,
      memberId: member._id,
      checkinDate: date
    });

    if (recordType === 'checkin') {
      if (record) {
        // 更新签到时间
        record.checkinTime = time;
        await record.save();
      } else {
        // 创建新记录
        record = new Record({
          tableId,
          memberId: member._id,
          checkinDate: date,
          checkinTime: time
        });
        await record.save();
      }

      return res.json({
        success: true,
        message: '签到成功',
        data: {
          id: record._id,
          memberName: member.name,
          memberEmployeeId: member.employeeId,
          checkinDate: record.checkinDate,
          checkinTime: record.checkinTime,
          recordType: 'checkin'
        }
      });
    } else {
      // 签退
      if (!record) {
        return res.status(400).json({
          success: false,
          message: '未找到签到记录，请先签到'
        });
      }

      record.checkoutDate = date;
      record.checkoutTime = time;
      await record.save();

      return res.json({
        success: true,
        message: '签退成功',
        data: {
          id: record._id,
          memberName: member.name,
          memberEmployeeId: member.employeeId,
          checkoutDate: record.checkoutDate,
          checkoutTime: record.checkoutTime,
          recordType: 'checkout'
        }
      });
    }
  } catch (error) {
    console.error('Card checkin error:', error);
    res.status(500).json({
      success: false,
      message: '刷卡签到失败'
    });
  }
});

module.exports = router;
