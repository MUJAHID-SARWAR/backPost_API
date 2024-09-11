const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const PostbackModel = require('./model/PostbackModel');
const UserModel = require('./model/UserModel');

dotenv.config(); // Load .env file

const app = express();
app.use(cors()); // Add CORS middleware
app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected...');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Example of a postback API endpoint
app.post('/postback', async (req, res) => {
  const secretKey = process.env.SECRET_KEY;

  // Fetch and assign values from the postback request
  const {
    extra_1: uid,
    transaction_id,
    payout,
    app_bundle_id,
    adv_app_name,
    virtual_currency,
    ip,
    event_name,
    campaign_id,
    sig: hash,
    begin_time = '',
    complete_time = ''
  } = req.body;

  try {
    // Validate Hash
    const checkString = `${transaction_id}-${uid}-${secretKey}`;
    const generatedHash = crypto.createHash('md5').update(checkString).digest('hex');

    if (generatedHash !== hash) {
      res.status(400).send("Invalid postback: Signature doesn't match.");
      return;
    }

    // Check for duplicate transactions
    const transactionExist = await PostbackModel.findOne({ uid, transaction_id, offer_id: campaign_id });

    if (transactionExist) {
      res.status(200).send("Duplicate transaction detected.");
      return;
    }

    // Create a new transaction record
    const newTransaction = new PostbackModel({
      uid,
      transaction_id,
      provider_id: 2,
      sbx_amount: virtual_currency,
      conversion_ip: ip,
      payout,
      offer_name: adv_app_name,
      offer_id: app_bundle_id,
      event_name,
      offer_begin_time: begin_time,
      offer_complete_time: complete_time
    });
    await newTransaction.save();

    // Update user balance
    let user = await UserModel.findOne({ uid });

    if (!user) {
      user = new UserModel({ uid });
    }

    const currentBalance = parseFloat(user.bux_balance || 0);
    const finalBalance = currentBalance + parseFloat(virtual_currency);
    user.bux_balance = finalBalance;
    await user.save();

    res.status(200).send("Postback received successfully.");
  } catch (error) {
    console.error('Error processing postback:', error);
    res.status(500).send("Error processing postback");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
