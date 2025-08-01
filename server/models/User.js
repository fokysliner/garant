const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName:  String,
  city:      String,
  phone:     String,
  email:     { type: String, unique: true, required: true },
  password:  { type: String, required: true },
  balance: { type: Number, default: 0 },

  
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
