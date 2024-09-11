const mongoose = require('mongoose');

const postbackSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  transaction_id: { type: String, required: true, unique: true },
  provider_id: Number,
  sbx_amount: Number,
  conversion_ip: String,
  payout: Number,
  offer_name: String,
  offer_id: String,
  event_name: String,
  offer_begin_time: Date,
  offer_complete_time: Date
});

const PostbackModel = mongoose.model('Postback', postbackSchema);
module.exports = PostbackModel;
