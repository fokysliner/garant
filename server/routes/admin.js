const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const User = require('../models/User'); 

router.get('/deals', admin.getAllDeals);
router.get('/users', admin.getAllUsers);
router.patch('/deal/:id/status', admin.updateDealStatus);
router.delete('/deal/:id', admin.deleteDeal);
router.delete('/user/:id', admin.deleteUser);

router.patch('/user/:id', admin.updateUser);           
router.patch('/user/:id/balance', admin.updateUserBalance);

router.put('/user/:id/set-balance', async (req, res) => {
  try {
    const { id } = req.params;
    let { newBalance } = req.body;
    newBalance = Number(newBalance);

    if (isNaN(newBalance)) {
      return res.status(400).json({ success: false, message: 'Баланс має бути числом' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.balance = newBalance;
    await user.save();

    return res.json({ success: true, balance: user.balance });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
