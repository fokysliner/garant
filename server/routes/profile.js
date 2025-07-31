const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// PATCH /api/me — оновлення профілю
router.patch('/me', auth, async (req, res) => {
  try {
    const { firstName, lastName, city, phone, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, city, phone, email },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city,
      phone: user.phone,
      email: user.email,
      balance: user.balance || 0,
      lockedBalance: user.lockedBalance || 0
    });
  } catch (e) {
    res.status(400).json({ error: 'Update error', message: e.message });
  }
});

// GET /api/me — повертає профіль з балансом
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      city: user.city,
      phone: user.phone,
      email: user.email,
      balance: user.balance || 0,
      lockedBalance: user.lockedBalance || 0
    });
  } catch (e) {
    res.status(400).json({ error: 'Read error', message: e.message });
  }
});

module.exports = router;
