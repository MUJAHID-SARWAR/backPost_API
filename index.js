const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config(); // Load .env file

const app = express();
app.use(express.json()); // Middleware to parse JSON

// In-memory storage
const transactions = [];
const users = {
  '123': { virtual_balance: 0 }
};

// Example of a postback API endpoint
app.get('/postback', async (req, res) => {
  const secretKey = process.env.SECRET_KEY;

  // Fetch and assign values from the postback request
  const uid = req.query.extra_1; // User ID
  const transaction_id = req.query.transaction_id;
  const payout = req.query.payout;
  const app_bundle_id = req.query.app_bundle_id;
  const adv_app_name = req.query.adv_app_name;
  const virtual_currency = req.query.virtual_currency;
  const ip = req.query.ip;
  const event_name = req.query.event_name;
  const campaign_id = req.query.campaign_id;
  const hash = req.query.sig; // Signature

  // Format date (if applicable)
  const begin_time = req.query.begin_time || ''; 
  const complete_time = req.query.complete_time || '';

  try {
    // ###### Validate Hash ######
    const checkString = `${transaction_id}-${uid}-${secretKey}`;
    const generatedHash = crypto.createHash('md5').update(checkString).digest('hex');

    // Compare provided hash with generated hash
    if (generatedHash !== hash) {
      res.status(400).send("Invalid postback: Signature doesn't match.");
      return;
    }

    // (no duplicate transactions allowed)
    const transactionExist = transactions.find(t => t.uid === uid && t.transaction_id === transaction_id);

    if (transactionExist) {
      res.status(200).send("Duplicate transaction detected.");
      return;
    }

    // Create a new transaction record in memory
    transactions.push({
      uid,
      transaction_id,
      payout,
      app_bundle_id,
      adv_app_name,
      virtual_currency,
      ip,
      event_name,
      campaign_id,
      begin_time,
      complete_time
    });

  
    const userData = users[uid] || { virtual_balance: 0 };
    const currentBalance = parseFloat(userData.virtual_balance);
    const finalBalance = currentBalance + parseFloat(virtual_currency);

    users[uid] = { virtual_balance: finalBalance };

    // Respond to the client (postback success)
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
