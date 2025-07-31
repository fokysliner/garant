const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, city, phone, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, city, phone, email, password: hash });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Неправильний email' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)   return res.status(401).json({ success: false, message: 'Неправильний пароль' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
};
