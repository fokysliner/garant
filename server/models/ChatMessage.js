const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  userId: String, 
  userName: String, 
  isAdmin: { type: Boolean, default: false }, 
  message: String,
  readByAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
