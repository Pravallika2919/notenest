const mongoose = require('mongoose');

module.exports = mongoose.model('Note', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  topic: { type: String, default: '' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  pinned: { type: Boolean, default: false },
  favorite: { type: Boolean, default: false },
  files: [{ name: String, path: String }]
}, { timestamps: true }));
