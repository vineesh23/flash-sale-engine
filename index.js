require('dotenv').config(); // Load environment variables
const express = require('express');
const redis = require('redis');
const amqp = require('amqplib');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

// --- SETUP SERVER WITH SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any frontend (Localhost or Vercel) to connect
    methods: ["GET", "POST"]
  }
});

let channel, redisClient;

async function setup() {
  try {
    // 1. Connect to Cloud Redis (Upstash)
    // MANUALLY PARSE THE URL TO AVOID CONFLICTS
    if (!process.env.REDIS_URL) {
      throw new Error("Redis URL is missing!");
    }

    // This converts "rediss://:password@host:port" into parts we can use
    const redisUrl = new URL(process.env.REDIS_URL);
    
    redisClient = redis.createClient({
      password: redisUrl.password,
      socket: {
        host: redisUrl.hostname,
        port: redisUrl.port,
        tls: true, // Force SSL
        rejectUnauthorized: false // Allow self-signed certs (Fixes the handshake error)
      }
    });
    
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
    
    // 2. Connect to Cloud RabbitMQ (CloudAMQP)
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('order_queue', { durable: true });
    
    console.log('✅ Connected to Cloud Redis & RabbitMQ');
  } catch (err) {
    console.error("❌ Connection Error:", err);
  }
}
setup();

// --- SOCKET CONNECTION ---
io.on('connection', async (socket) => {
  console.log('A user connected');
  
  // Send current stock immediately to the new user
  if (redisClient && redisClient.isOpen) {
    const currentStock = await redisClient.get('product_stock:1');
    socket.emit('stock_update', parseInt(currentStock || 0));
  }
});

// --- BUY ROUTE ---
app.post('/buy', async (req, res) => {
  const { userId, productId } = req.body;
  
  if (!redisClient || !channel) return res.status(500).send("System starting up...");

  try {
    // 1. ATOMIC DECREMENT (Redis)
    const remainingStock = await redisClient.decr(`product_stock:${productId}`);

    if (remainingStock >= 0) {
      // 2. Send to Queue (RabbitMQ)
      const orderData = JSON.stringify({ userId, productId });
      channel.sendToQueue('order_queue', Buffer.from(orderData));

      // 3. BROADCAST NEW STOCK TO ALL USERS 📡
      io.emit('stock_update', remainingStock);

      res.json({ message: "Order Received! Processing..." });
    } else {
      // Stock went negative, fix the display and reject
      io.emit('stock_update', 0);
      res.status(400).json({ message: "Sold Out!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

server.listen(3001, () => {
  console.log('🚀 WebSocket Server running on port 3001');
});