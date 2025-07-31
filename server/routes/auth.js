const express = require('express');
const { register, login } = require('../controllers/authController');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login',    login);

// === Додаємо цей роут для профілю ===
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    firstName: user.firstName,
    lastName: user.lastName,
    city: user.city,
    phone: user.phone,
    email: user.email
  });
});

module.exports = router;
