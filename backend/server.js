const express = require("express");
const app = express();
const cors = require("cors");
const dbService = require("./services/dbService");
const authRoutes = require("./routes/authRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const cookieParser = require("cookie-parser");

app.use(
  cors({
    origin: "http://localhost:5173", // your frontend
    credentials: true, // allow cookies/auth headers
  })
);

app.use(cookieParser());

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", movieRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
