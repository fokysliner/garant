const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  topic: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);
