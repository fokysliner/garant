const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  userId: String, 
  userName: String, 
  isAdmin: { type: Boolean, default: false }, 
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
