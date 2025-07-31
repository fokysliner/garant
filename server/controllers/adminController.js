const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const User = require('../models/User');

exports.getAllDeals = async (req, res) => {
  try {
    const { userId } = req.query;
    let deals;
    if (userId) {
      deals = await Deal.find({ owner: mongoose.Types.ObjectId(userId) })
        .populate('owner', 'email')
        .sort({ createdAt: -1 });
    } else {
      deals = await Deal.find().populate('owner', 'email').sort({ createdAt: -1 });
    }
    res.json({ success: true, deals });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, role } = req.body;
  const update = {};
  if (firstName !== undefined) update.firstName = firstName;
  if (lastName  !== undefined) update.lastName  = lastName;
  if (email     !== undefined) update.email     = email;
  if (role      !== undefined) update.role      = role;

  try {
    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Помилка сервера' });
  }
};

exports.updateDealStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await Deal.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }
    res.json({ success: true, deal: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.deleteDeal = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Deal.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await User.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateUserBalance = async (req, res) => {
  const { id } = req.params;
  let { balance } = req.body;

  balance = Number(balance);

  if (isNaN(balance)) {
    return res.status(400).json({ success: false, message: 'Баланс має бути числом' });
  }
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }
    user.balance = balance;
    await user.save();
    res.json({ success: true, balance: user.balance });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Внутрішня помилка сервера' });
  }
};
