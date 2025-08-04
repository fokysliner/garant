const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage'); // Модель з Mongoose

router.post('/', async (req, res) => {
  const { chatId, userId, userName, message, isAdmin } = req.body;
  if (!chatId || !userId || !message) return res.status(400).json({ success: false });

  await ChatMessage.create({
    chatId, userId, userName, message, isAdmin: !!isAdmin, timestamp: new Date()
  });
  res.json({ success: true });
});

router.get('/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const messages = await ChatMessage.find({ chatId, timestamp: { $gte: since } }).sort('timestamp').lean();
  res.json(messages);
});

module.exports = router;
