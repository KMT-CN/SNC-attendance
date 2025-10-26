const express = require('express');
const { body, validationResult } = require('express-validator');
const Settings = require('../models/Settings');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 获取所有设置
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.find();
    
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败'
    });
  }
});

// 设置活动表格
router.put('/active-table', [
  body('tableId').notEmpty().withMessage('表格ID不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { tableId } = req.body;

    await Settings.findOneAndUpdate(
      { key: 'activeTable' },
      { key: 'activeTable', value: tableId },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: '活动表格设置成功'
    });
  } catch (error) {
    console.error('Set active table error:', error);
    res.status(500).json({
      success: false,
      message: '设置失败'
    });
  }
});

// 设置模式
router.put('/mode', [
  body('mode').isIn(['checkin', 'checkout']).withMessage('模式无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
      });
    }

    const { mode } = req.body;

    await Settings.findOneAndUpdate(
      { key: 'mode' },
      { key: 'mode', value: mode },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: '模式设置成功'
    });
  } catch (error) {
    console.error('Set mode error:', error);
    res.status(500).json({
      success: false,
      message: '设置失败'
    });
  }
});

module.exports = router;
