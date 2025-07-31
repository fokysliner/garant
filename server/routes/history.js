const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/history
router.get('/api/history', auth, async (req, res) => {
  const { account, currency, dateFrom, dateTo } = req.query;
  // TODO: Тут шукаєш операції в БД, наприклад:
  // const operations = await Operation.find({...});
  res.json({ operations: [ /* масив операцій */ ] });
});

module.exports = router;
