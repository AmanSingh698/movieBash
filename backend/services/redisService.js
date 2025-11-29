// services/redisService.js
const { createClient } = require("redis");
require("dotenv").config();

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const client = createClient({ url: REDIS_URL });

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log("Connected to Redis at", REDIS_URL);
  }
}

module.exports = { client, connectRedis };
