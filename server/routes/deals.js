const express = require('express');
const router  = express.Router();
const auth = require('../middleware/auth');

const {
  createDeal,
  getDeals,
  getDealById,
  acceptDeal,
  declineDeal
} = require('../controllers/dealsController');

router.use(auth);

router.post('/', createDeal);

router.get('/',  getDeals);

router.get('/:id', getDealById);

router.post('/:id/accept', acceptDeal);

router.post('/:id/decline', declineDeal);

module.exports = router;
