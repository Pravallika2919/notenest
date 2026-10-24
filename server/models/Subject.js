const mongoose = require('mongoose');

module.exports = mongoose.model('Subject', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#6366f1' },
  examDate: Date // optional: powers the exam countdown
}, { timestamps: true }));
