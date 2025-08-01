const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

router.get('/all-users', async (req, res) => {
  const users = await User.find({}, { _id: 1, firstName: 1, lastName: 1, email: 1 });
  const unread = await ChatMessage.aggregate([
    { $match: { isAdmin: false, readByAdmin: { $ne: true } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } }
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

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const messages = await ChatMessage.find({ userId }).sort('createdAt');
  await ChatMessage.updateMany(
    { userId, isAdmin: false, readByAdmin: { $ne: true } },
    { $set: { readByAdmin: true } }
  );
  res.json(messages);
});

router.post('/', async (req, res) => {
  const { userId, userName, message, isAdmin } = req.body;
  const chatMsg = new ChatMessage({
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
