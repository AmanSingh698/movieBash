const Redis = require("ioredis");

let client = null;
let isConnected = false;

/**
 * Returns the singleton Redis client.
 * Call connect() once at startup (server.js).
 */
function getClient() {
  return client;
}

/**
 * Initialise and connect the Redis client.
 * Resolves when the connection is ready, or rejects after the first
 * failed attempt — the app will continue but caching is disabled.
 */
function connect() {
  return new Promise((resolve) => {
    client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      lazyConnect: true,
      maxRetriesPerRequest: 1, // fail fast on individual commands
      enableReadyCheck: true,
    });

    client.on("ready", () => {
      isConnected = true;
      console.log("✅ Redis connected:", process.env.REDIS_URL || "redis://localhost:6379");
      resolve();
    });

    client.on("error", (err) => {
      if (isConnected) {
        // Only log after initial connect; don't spam on reconnect attempts
        console.warn("⚠️  Redis error:", err.message);
      } else {
        console.warn("⚠️  Redis unavailable — caching disabled. App will continue.");
        resolve(); // don't block server startup
      }
    });

    client.on("close", () => {
      isConnected = false;
    });

    client.connect().catch(() => {
      // swallowed — handled in "error" listener above
    });
  });
}

// ─── Safe wrapper helpers ─────────────────────────────────────────────────────
// All helpers return null / false on Redis failure so callers can fall back
// to the database without crashing.

async function get(key) {
  if (!isConnected) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    console.warn("Redis GET error:", err.message);
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  if (!isConnected) return false;
  try {
    const serialised = JSON.stringify(value);
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serialised);
    } else {
      await client.set(key, serialised);
    }
    return true;
  } catch (err) {
    console.warn("Redis SET error:", err.message);
    return false;
  }
}

async function del(...keys) {
  if (!isConnected) return false;
  try {
    await client.del(...keys);
    return true;
  } catch (err) {
    console.warn("Redis DEL error:", err.message);
    return false;
  }
}

/**
 * Atomic SET if not exists with TTL.
 * Returns true  → lock acquired by this caller.
 * Returns false → key already exists (locked by someone else).
 */
async function setNX(key, value, ttlSeconds) {
  if (!isConnected) return null; // null = Redis unavailable, caller decides
  try {
    const result = await client.set(key, value, "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch (err) {
    console.warn("Redis SETNX error:", err.message);
    return null;
  }
}

/**
 * Get the remaining TTL of a key (in seconds).
 * Returns -2 if key doesn't exist, -1 if no TTL.
 */
async function ttl(key) {
  if (!isConnected) return -2;
  try {
    return await client.ttl(key);
  } catch (err) {
    console.warn("Redis TTL error:", err.message);
    return -2;
  }
}

/**
 * Scan for keys matching a pattern (use sparingly in production).
 */
async function keys(pattern) {
  if (!isConnected) return [];
  try {
    return await client.keys(pattern);
  } catch (err) {
    console.warn("Redis KEYS error:", err.message);
    return [];
  }
}

function isReady() {
  return isConnected;
}

module.exports = { connect, getClient, get, set, del, setNX, ttl, keys, isReady };
