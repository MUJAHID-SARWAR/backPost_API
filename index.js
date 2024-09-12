const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const PostbackModel = require('./model/PostbackModel');  
const UserModel = require('./model/UserModel');          

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected...');
}).catch((err) => {
  console.error('MongoDB connection error try again:', err);
  process.exit(1);
});

// Middleware to extract the IP address
app.use((req, res, next) => {
  const requestIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const allowedIP = process.env.ALLOWED_IP;

  const isLocalhost = requestIP === '::1' || requestIP === '127.0.0.1';

  if (!isLocalhost && requestIP !== allowedIP) {
    return res.status(403).send("Access denied: IP not allowed.");
  }

  next();
});

app.post('/postback', async (req, res) => {
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
    begin_time = '',
    complete_time = ''
  } = req.body;

  try {
    console.log('Received postback:', req.body);

    // Checking for duplicate transactions
    const transactionExist = await PostbackModel.findOne({ uid, transaction_id, offer_id: campaign_id });

    if (transactionExist) {
      return res.status(200).send("Duplicate transaction detected.");
    }

    // Create new transaction record
    const newTransaction = new PostbackModel({
      uid,
      transaction_id,
      provider_id: 3,
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
    console.error('Error processing postback:', error.message);
    console.error('Stack trace:', error.stack);

    res.status(500).send("Error processing postback: " + error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
