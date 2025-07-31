const express = require('express');
const router  = express.Router();
const { createDeal, getDeals } = require('../controllers/dealsController');
const auth = require('../middleware/auth');

// захищаємо всі роутері одним middleware
router.use(auth);

router.post('/', createDeal);
router.get('/',  getDeals);

module.exports = router;
