const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  bux_balance: { type: Number, default: 0 }
});

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;
