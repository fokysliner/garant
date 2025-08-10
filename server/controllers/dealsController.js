const mongoose = require('mongoose');
const Deal = require('../models/Deal');

exports.createDeal = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(400).json({ success: false, message: 'Невірний користувач' });
    }
    const userId = req.user.id;

    const { role, type, title, amount, fee, commissionPayer, deadline, description } = req.body;
    if (!role || !type || !title || !amount || !fee || !commissionPayer || !deadline) {
      return res.status(400).json({ success: false, message: 'Усі поля повинні бути заповнені' });
    }

    const deal = new Deal({
      owner: userId,
      role, type, title, amount, fee, commissionPayer, deadline, description,
      status: 'waiting_partner' // логічніше після створення
    });

    await deal.save();
    res.json({ success: true, deal });
  } catch (err) {
    console.error('[createDeal]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDeals = async (req, res) => {
  try {
    const userId = req.user.id;
    let filter = {};

    if (req.query.mine === '1') {
      const me = new mongoose.Types.ObjectId(userId);
      filter = { $or: [{ owner: me }, { partnerId: me }] };
    } else {
      // твоя стара логіка: лише створені мною
      filter = { owner: userId };
    }

    const deals = await Deal.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, deals });
  } catch (err) {
    console.error('[getDeals]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Угоду не знайдено' });
    res.json({ success: true, deal });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Некоректний ID угоди' });
  }
};

exports.acceptDeal = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Угоду не знайдено' });

    if (String(deal.owner) === userId) {
      return res.status(400).json({ success: false, message: 'Ви автор цієї угоди' });
    }
    if (deal.partnerId && String(deal.partnerId) !== userId) {
      return res.status(409).json({ success: false, message: 'Угоду вже прийнято іншим користувачем' });
    }

    deal.partnerId = new mongoose.Types.ObjectId(userId);

    const terminal = ['accepted','confirmed','completed','rejected','canceled'];
    if (!terminal.includes((deal.status || '').toLowerCase())) {
      deal.status = 'accepted';
    }

    await deal.save();
    res.json({ success: true });
  } catch (err) {
    console.error('[acceptDeal]', err);
    res.status(500).json({ success: false, message: 'Помилка при прийнятті угоди' });
  }
};

exports.declineDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ success: false, message: 'Угоду не знайдено' });
    deal.status = 'rejected';
    await deal.save();
    res.json({ success: true });
  } catch (err) {
    console.error('[declineDeal]', err);
    res.status(500).json({ success: false, message: 'Помилка при відхиленні угоди' });
  }
};
