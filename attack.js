const axios = require('axios');

const URL = 'http://localhost:3000/buy';
const TOTAL_REQUESTS = 300; // More requests than stock (Stock is 100)

async function sendRequest(i) {
  try {
    // We send a unique user ID for each request
    await axios.post(URL, { 
      userId: `user_${i}`, 
      productId: 1 
    });
    return { status: 'success' };
  } catch (error) {
    return { status: 'failed' }; // Returns failed if server says "Sold Out"
  }
}

async function startAttack() {
  console.log(`🔥 Starting attack with ${TOTAL_REQUESTS} concurrent requests...`);
  
  const requests = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    // We push all requests to an array, but don't await them yet.
    // This ensures they all fire off at roughly the same time.
    requests.push(sendRequest(i));
  }

  // WAIT for all 300 requests to finish
  const results = await Promise.all(requests);
  
  // COUNT the successes
  const successfulOrders = results.filter(r => r.status === 'success').length;
  
  console.log(`\n--- ATTACK REPORT ---`);
  console.log(`📦 Initial Stock: 100`);
  console.log(`🛒 Successful Orders: ${successfulOrders}`);
  
  if (successfulOrders > 100) {
    console.log(`🚨 CRITICAL FAIL: You sold ${successfulOrders} items but only had 100!`);
    console.log(`❌ Oversold by: ${successfulOrders - 100}`);
  } else {
    console.log(`✅ System handled it correctly.`);
  }
}

startAttack();