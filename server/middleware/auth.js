const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
require('dotenv').config();

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ success: false, message: 'Токен не знайдено' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ success: false, message: 'Користувача не знайдено' });

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Невірний токен' });
  }
};
