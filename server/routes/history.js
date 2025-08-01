const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/api/history', auth, async (req, res) => {
  const { account, currency, dateFrom, dateTo } = req.query;
  res.json({ operations: [  ] });
});

module.exports = router;
