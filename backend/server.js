require("dotenv").config(); // Must be first — loads env vars before anything else

const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dbService = require("./services/dbService");
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cookieParser = require("cookie-parser");

// --- Security Headers (Fix #13) ---
app.use(helmet());

// --- CORS (Fix #10 — origin from env, not hardcoded) ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// --- Rate Limiting on Auth Routes (Fix #13) ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 auth requests per IP per window
  message: { message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cookieParser());
app.use(express.json());

// Apply auth rate limiter only to auth routes
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

// --- Start Server (Fix #11 — port from env) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
