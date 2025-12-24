const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'user123',
  host: 'localhost',
  database: 'flash_sale_db',
  password: 'password123',
  port: 5432,
});

const redisClient = redis.createClient();
redisClient.connect().then(() => console.log('✅ Connected to Redis'));

// --- THE FIXED ENDPOINT ---
app.post('/buy', async (req, res) => {
  const { userId, productId } = req.body;
  const key = `product_stock:${productId}`;

  try {
    // 1. ATOMIC DECREMENT (The Magic Fix)
    // Redis instantly subtracts 1 and returns the NEW value.
    // No two requests can happen at the same time here.
    const remainingStock = await redisClient.decr(key);

    if (remainingStock >= 0) {
      // 2. SUCCESS: We secured an item!
      
      // (Optional: We still add latency to simulate realism, 
      // but it won't break the system anymore because Redis already reserved it)
      // await new Promise(resolve => setTimeout(resolve, 50)); 

      // 3. Record the order in Postgres
      // In a real system, we would push to RabbitMQ here (Phase 2).
      // For now, we write to DB directly to prove the fix.
      await pool.query('INSERT INTO orders (user_id, product_id, quantity) VALUES ($1, $2, $3)', [userId, productId, 1]);

      res.json({ message: "Success! Order placed." });
    } else {
      // 3. FAIL: Stock went below 0 (e.g., -1, -2)
      // We oversold in Redis, so we don't touch the Database.
      res.status(400).json({ message: "Sold Out!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});