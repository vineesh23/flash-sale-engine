require('dotenv').config(); // Load environment variables from .env file
const { Pool } = require('pg');
const redis = require('redis');

// 1. Setup Postgres Connection (Using Cloud URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true // Simple SSL enforcement for Neon
});

// 2. Setup Redis Connection (Using Cloud URL)
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const setupDatabase = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    console.log("✅ Connected to Cloud Redis");

    // 3. Reset Postgres Tables
    console.log("⏳ Resetting Database...");
    await pool.query(`DROP TABLE IF EXISTS orders;`);
    await pool.query(`DROP TABLE IF EXISTS products;`);

    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        stock INT,
        price INT
      );
    `);

    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50),
        product_id INT,
        quantity INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Insert Dummy Data into Postgres
    await pool.query(`
      INSERT INTO products (name, stock, price) 
      VALUES ('iPhone 15 Pro', 100, 999);
    `);

    // 5. --- CRITICAL STEP: SYNC REDIS ---
    // We set the Redis counter to match the DB stock (100)
    await redisClient.set('product_stock:1', 100);

    console.log("✅ Database reset.");
    console.log("✅ Redis initialized: 'product_stock:1' = 100");
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

setupDatabase();