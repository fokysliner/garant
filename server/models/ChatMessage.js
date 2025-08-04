const mongoose = require('mongoose');
const ChatMessageSchema = new mongoose.Schema({
  chatId:    { type: String, required: true, index: true },
  userId:    { type: String, required: true },
  userName:  { type: String },
  message:   { type: String, required: true },
  isAdmin:   { type: Boolean, default: false },
  timestamp: { type: Date,    default: Date.now, index: true }
});
module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
