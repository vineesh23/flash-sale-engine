# ⚡ FlashSale Engine

> A high-concurrency e-commerce backend capable of handling thousands of requests per second without overselling.

![System Status](https://img.shields.io/badge/Status-Live-success)
![Tech Stack](https://img.shields.io/badge/Tech-Node.js%20%7C%20Redis%20%7C%20RabbitMQ%20%7C%20Postgres-blue)

## 🚀 Live Demo
- **Frontend (Vercel):** https://flash-sale-engine.vercel.app/
- **Backend (Render):** https://flash-sale-engine.onrender.com/

---

## 🏗️ System Architecture

This project solves the **"Race Condition"** problem common in ticket booking and flash sale systems (like Flipkart Big Billion Day or Ticketmaster).

**The Flow:**
1. **Client** sends a "Buy" request via **Next.js**.
2. **API Server** checks stock in **Redis (Atomic Decrement)**.
   - *If stock > 0:* Request is pushed to **RabbitMQ** (Asynchronous).
   - *If stock = 0:* Request is rejected instantly (10ms latency).
3. **Background Worker** pulls orders from the Queue and saves them to **PostgreSQL**.
4. **WebSockets** broadcast the new stock count to all connected users in real-time.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Neon Serverless)
- **Caching & Locking:** Redis (Upstash)
- **Message Queue:** RabbitMQ (CloudAMQP)
- **Real-Time:** Socket.io (WebSockets)
- **Frontend:** Next.js, Tailwind CSS
- **Deployment:** Render (Backend), Vercel (Frontend)

---

## ⚡ Key Features

### 1. Concurrency Handling
Traditional databases fail under high load due to locking. This system uses **Redis Atomic Counters** (`DECR`) to handle inventory. This ensures that even if 1,000 users click "Buy" at the exact same millisecond, we never sell more items than we have.

### 2. Event-Driven Architecture
Instead of making the user wait for the Database to write (which is slow), we offload the heavy lifting to a **Message Queue (RabbitMQ)**. The user gets an instant "Order Received" response, while a worker processes the transaction in the background.

### 3. Real-Time Updates
Uses **WebSockets** to push inventory changes to the frontend immediately. No page refresh required.

---

## 🏃‍♂️ How to Run Locally

### 1. Clone the Repo
```bash
git clone [https://github.com/vineesh23/flash-sale-engine.git](https://github.com/vineesh23/flash-sale-engine.git)
cd flash-sale-engine
```
### 2. Install Dependencies
```bash
npm install
cd frontend
npm install
```
### 3. Set Up Environment Variables
 Create a .env file in the root directory and add your cloud keys:
 ```bash
DATABASE_URL="your_neon_postgres_url"
REDIS_URL="your_upstash_redis_url"
RABBITMQ_URL="your_cloudamqp_url"
```
### 4. Run the System
You need 3 terminals open to run the full hybrid setup:
Terminal 1 (Backend API):
```bash
node index.js
```
Terminal 2 (Background Worker):
```bash
node worker.js
```
Terminal 3 (Frontend):
```bash
cd frontend
npm run dev
```

**After pasting:**
1.  Save the file.
2.  Push to GitHub again:
    ```bash
    git add README.md
    git commit -m "Fix README formatting"
    git push origin main
    ```

Check your GitHub repo link—it should now look perfect!


