const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');

router.get('/all-users', async (req, res) => {
  const users = await ChatMessage.aggregate([
    { $match: { isAdmin: false } }, 
    { $group: { _id: "$userId", userName: { $first: "$userName" } } },
    { $sort: { _id: 1 } }
  ]);
  res.json(users);
});

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const messages = await ChatMessage.find({ userId }).sort('createdAt');
  res.json(messages);
});

router.post('/', async (req, res) => {
  const { userId, userName, message, isAdmin } = req.body;
  const chatMsg = new ChatMessage({ userId, userName, message, isAdmin });
  await chatMsg.save();
  res.json({ success: true });
});

module.exports = router;
