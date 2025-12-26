const express = require('express');
const redis = require('redis');
const amqp = require('amqplib');
const cors = require('cors');
const http = require('http'); // New
const { Server } = require('socket.io'); // New

const app = express();
app.use(cors());
app.use(express.json());

// --- SETUP SERVER WITH SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"]
  }
});

let channel, redisClient;

async function setup() {
  redisClient = redis.createClient();
  await redisClient.connect();
  
  const connection = await amqp.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue('order_queue', { durable: true });
  
  console.log('✅ Connected to Redis & RabbitMQ');
}
setup();

// --- SOCKET CONNECTION ---
io.on('connection', async (socket) => {
  console.log('A user connected');
  
  // Send current stock immediately to the new user
  if (redisClient) {
    const currentStock = await redisClient.get('product_stock:1');
    socket.emit('stock_update', parseInt(currentStock || 0));
  }
});

// --- BUY ROUTE ---
app.post('/buy', async (req, res) => {
  const { userId, productId } = req.body;
  
  if (!redisClient || !channel) return res.status(500).send("Starting up...");

  try {
    const remainingStock = await redisClient.decr(`product_stock:${productId}`);

    if (remainingStock >= 0) {
      // 1. Send to Queue
      const orderData = JSON.stringify({ userId, productId });
      channel.sendToQueue('order_queue', Buffer.from(orderData));

      // 2. BROADCAST NEW STOCK TO ALL USERS 📡
      io.emit('stock_update', remainingStock);

      res.json({ message: "Order Received! Processing..." });
    } else {
      // Fix negative stock in Redis display
      io.emit('stock_update', 0);
      res.status(400).json({ message: "Sold Out!" });
    }
  } catch (err) {
    res.status(500).send("Error");
  }
});

// IMPORTANT: Change app.listen to server.listen
server.listen(3001, () => { // Changed port to 3001 to avoid conflict if frontend uses 3000
  console.log('🚀 WebSocket Server running on port 3001');
});