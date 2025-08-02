
const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');


router.get('/all-users', async (req, res) => {
  const users = await User.find({}, { _id: 1, firstName: 1, lastName: 1, email: 1 });
  const unread = await ChatMessage.aggregate([
    { $match: { isAdmin: false, readByAdmin: { $ne: true } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);
  const unreadMap = {};
  unread.forEach(u => unreadMap[u._id?.toString()] = u.count);

  const result = users.map(u => ({
    _id: u._id,
    userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    email: u.email,
    unreadCount: unreadMap[u._id?.toString()] || 0
  }));

  res.json(result);
});


router.get('/:chatId', async (req, res) => {
  const { chatId } = req.params;
  if (!chatId) {
    return res.status(400).json({ success: false, error: 'Missing chatId' });
  }

  const messages = await ChatMessage.find({ chatId }).sort('createdAt');

  await ChatMessage.updateMany(
    { chatId, isAdmin: false, readByAdmin: { $ne: true } },
    { $set: { readByAdmin: true } }
  );

  res.json(messages);
});



router.post('/', async (req, res) => {
  const { chatId, userId, userName, message, isAdmin } = req.body;

  if (!chatId) {
    return res.status(400).json({ success: false, error: 'Missing chatId' });
  }

  const chatMsg = new ChatMessage({
    chatId,
    userId,
    userName,
    message,
    isAdmin,
    readByAdmin: isAdmin
  });

  await chatMsg.save();
  res.json({ success: true });
});


module.exports = router;
