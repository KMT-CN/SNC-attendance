const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  checkinDate: {
    type: String, // YYYY-MM-DD 格式
    default: null
  },
  checkinTime: {
    type: String, // HH:MM 格式
    default: null
  },
  checkoutDate: {
    type: String,
    default: null
  },
  checkoutTime: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['completed', 'checkedin', 'pending'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

recordSchema.index({ tableId: 1, memberId: 1, checkinDate: -1 });

recordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // 自动更新状态
  if (this.checkinDate && this.checkinTime && this.checkoutDate && this.checkoutTime) {
    this.status = 'completed';
  } else if (this.checkinDate && this.checkinTime) {
    this.status = 'checkedin';
  } else {
    this.status = 'pending';
  }
  
  next();
});

module.exports = mongoose.model('Record', recordSchema);
