const amqp = require('amqplib');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'user123',
  host: 'localhost',
  database: 'flash_sale_db',
  password: 'password123',
  port: 5432,
});

async function startWorker() {
  try {
    // 1. Connect to RabbitMQ
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'order_queue';

    // 2. Make sure the queue exists
    await channel.assertQueue(queue, { durable: true });

    console.log("👷 Worker started! Waiting for orders...");

    // 3. Process Orders
    channel.consume(queue, async (msg) => {
      const orderData = JSON.parse(msg.content.toString());
      const { userId, productId } = orderData;

      console.log(`📥 Received order for ${userId}`);

      try {
        // 4. Save to Postgres (The heavy lifting)
        await pool.query(
          'INSERT INTO orders (user_id, product_id, quantity) VALUES ($1, $2, $3)',
          [userId, productId, 1]
        );
        console.log(`✅ Saved order to DB for ${userId}`);
        
        // 5. Acknowledge (Tell RabbitMQ we are done)
        channel.ack(msg);
      } catch (err) {
        console.error("❌ Database save failed", err);
        // If it fails, we don't ack, so RabbitMQ will retry later.
      }
    });

  } catch (error) {
    console.error("Worker Error:", error);
  }
}

startWorker();