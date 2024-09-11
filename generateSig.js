const crypto = require('crypto');
const secretKey = 'rana@Mujahidsarwar';
const transaction_id = 'abc123';
const uid = '123';
const checkString = `${transaction_id}-${uid}-${secretKey}`;
const generatedHash = crypto.createHash('md5').update(checkString).digest('hex');
console.log(generatedHash); // Should match the `sig` parameter in the URL
