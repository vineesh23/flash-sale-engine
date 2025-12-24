const { Pool } = require('pg');
const redis = require('redis');

const pool = new Pool({
  user: 'user123',
  host: 'localhost',
  database: 'flash_sale_db',
  password: 'password123',
  port: 5432,
});

const redisClient = redis.createClient();

const setupDatabase = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();

    // 1. Reset Postgres Tables
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

    // 2. Insert Dummy Data into Postgres
    await pool.query(`
      INSERT INTO products (name, stock, price) 
      VALUES ('iPhone 15 Pro', 100, 999);
    `);

    // 3. --- CRITICAL STEP: SYNC REDIS ---
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