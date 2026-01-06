const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authenticateJWT = require("../middlewares/authMiddleware");

// All payment routes require authentication
router.post("/create-order", authenticateJWT, paymentController.createOrder);
router.post("/verify", authenticateJWT, paymentController.verifyPayment);

// Webhook doesn't need auth (Razorpay calls it)
router.post("/webhook", paymentController.handleWebhook);

module.exports = router;
