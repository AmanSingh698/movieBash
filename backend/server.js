require("dotenv").config(); // Must be first — loads env vars before anything else

const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisService = require("./services/redisService");
const dbService = require("./services/dbService");
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cookieParser = require("cookie-parser");

// --- Security Headers ---
app.use(helmet());

// --- CORS ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// --- Rate Limiting (Redis-backed when available, falls back to memory) ---
const buildAuthLimiter = () => {
  const limiterOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
  };

  if (redisService.isReady()) {
    limiterOptions.store = new RedisStore({
      // ioredis client compatible with rate-limit-redis
      sendCommand: (...args) => redisService.getClient().call(...args),
      prefix: "rl:auth:",
    });
    console.log("✅ Rate limiter using Redis store");
  } else {
    console.warn("⚠️  Rate limiter using in-memory store (Redis unavailable)");
  }

  return rateLimit(limiterOptions);
};

// --- Routes (mounted after Redis is ready) ---
const startServer = async () => {
  // 1. Connect Redis (non-blocking — app starts even if Redis is down)
  await redisService.connect();

  // 2. Build rate limiter now that Redis status is known
  const authLimiter = buildAuthLimiter();

  // 3. Mount routes
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api", movieRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/payments", paymentRoutes);

  // --- 404 Catch-All ---
  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // --- Global Error Handler ---
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
    });
  });

  // 4. Start Express
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
