require('dotenv').config(); // Load environment variables
const amqp = require('amqplib');
const { Pool } = require('pg');

// 1. Setup Postgres Connection (Cloud)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  }
});

async function startWorker() {
  try {
    // 2. Connect to RabbitMQ (Cloud)
    // We use the CloudAMQP URL from your .env file
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'order_queue';

    // 3. Make sure the queue exists
    await channel.assertQueue(queue, { durable: true });

    console.log("👷 Cloud Worker started! Waiting for orders...");

    // 4. Process Orders
    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const orderData = JSON.parse(msg.content.toString());
        const { userId, productId } = orderData;

        console.log(`📥 Received order for ${userId}`);

        try {
          // 5. Save to Postgres (The heavy lifting)
          await pool.query(
            'INSERT INTO orders (user_id, product_id, quantity) VALUES ($1, $2, $3)',
            [userId, productId, 1]
          );
          console.log(`✅ Saved order to DB for ${userId}`);
          
          // 6. Acknowledge (Tell RabbitMQ we are done)
          channel.ack(msg);
        } catch (err) {
          console.error("❌ Database save failed", err);
          // If it fails, we don't ack, so RabbitMQ will retry later.
        }
      }
    });

  } catch (error) {
    console.error("Worker Error:", error);
  }
}

startWorker();