const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    default: ''
  },
  cardId: {
    type: String,
    default: '',
    trim: true,
    sparse: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

memberSchema.index({ tableId: 1, employeeId: 1 });
memberSchema.index({ cardId: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('Member', memberSchema);
