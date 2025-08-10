const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },             
  role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
  type: { type: String, enum: ['individual', 'company'], default: 'individual' },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  fee: { type: Number, required: true },
  commissionPayer: { type: String, enum: ['me', 'partner', 'split'], default: 'me' },
  deadline: { type: Date, required: true },
  status: { type: String, default: 'pending' },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Deal', dealSchema);
