const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SupportRequest = require('../models/SupportRequest');

// Створення звернення
router.post('/support', auth, async (req, res) => {
  const { topic, message } = req.body;
  if (!topic || !message) return res.status(400).json({ error: 'Заповніть всі поля' });

  const support = await SupportRequest.create({
    userId: req.user.id,
    topic,
    message,
  });
  res.json({ success: true, support });
});

// Список звернень юзера
router.get('/support', auth, async (req, res) => {
  const list = await SupportRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, list });
});

module.exports = router;
