const express = require('express');
const redis = require('redis');
const amqp = require('amqplib');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// --- CONNECT TO RABBITMQ & REDIS ---
let channel, redisClient;

async function setup() {
  // 1. Redis
  redisClient = redis.createClient();
  await redisClient.connect();
  console.log('✅ Connected to Redis');

  // 2. RabbitMQ
  const connection = await amqp.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue('order_queue', { durable: true });
  console.log('✅ Connected to RabbitMQ');
}

setup();

// --- THE ULTRA-FAST ENDPOINT ---
app.post('/buy', async (req, res) => {
  const { userId, productId } = req.body;
  
  if (!redisClient || !channel) {
    return res.status(500).send("System starting up...");
  }

  try {
    // 1. ATOMIC STOCK CHECK (Fast)
    const remainingStock = await redisClient.decr(`product_stock:${productId}`);

    if (remainingStock >= 0) {
      // 2. SEND TO QUEUE (Fast)
      // We do NOT wait for the database here.
      const orderData = JSON.stringify({ userId, productId });
      channel.sendToQueue('order_queue', Buffer.from(orderData));

      // 3. INSTANT RESPONSE
      res.json({ message: "Order Received! Processing..." });
    } else {
      res.status(400).json({ message: "Sold Out!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});