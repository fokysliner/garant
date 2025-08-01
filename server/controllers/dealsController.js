const Deal = require('../models/Deal');

exports.createDeal = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ success: false, message: 'Невірний користувач' });
    }
    const userId = req.user.id;

    const { role, type, title, amount, fee, commissionPayer, deadline, description } = req.body;

    if (!role || !type || !title || !amount || !fee || !commissionPayer || !deadline) {
      return res.status(400).json({ success: false, message: 'Усі поля повинні бути заповнені' });
    }

    const deal = new Deal({
      owner: userId,
      role,
      type,
      title,
      amount,
      fee,
      commissionPayer,
      deadline,
      description 
    });

    await deal.save();
    res.json({ success: true, deal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const deals = await Deal
      .find({ owner: userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, deals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
