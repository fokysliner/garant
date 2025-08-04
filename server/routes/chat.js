const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');

// Додаємо чат
router.post('/', async (req, res) => {
  const { chatId, userId, userName, message, isAdmin } = req.body;
  if (!chatId || !userId || !message) return res.status(400).json({ success: false });

  await ChatMessage.create({
    chatId, userId, userName, message, isAdmin: !!isAdmin, timestamp: new Date()
  });
  res.json({ success: true });
});

// Повідомлення для певного чату (за 24 год)
router.get('/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const messages = await ChatMessage.find({ chatId, timestamp: { $gte: since } }).sort('timestamp').lean();
  res.json(messages);
});

// Список чатів для адмінки (останнє повідомлення по кожному чату)
router.get('/', async (req, res) => {
  const aggr = await ChatMessage.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: {
      _id: "$chatId",
      lastMessage: { $first: "$message" },
      lastUserName: { $first: "$userName" },
      lastIsAdmin: { $first: "$isAdmin" },
      lastTime: { $first: "$timestamp" }
    }},
    { $sort: { lastTime: -1 } }
  ]);
  res.json({ success: true, chats: aggr });
});

module.exports = router;
