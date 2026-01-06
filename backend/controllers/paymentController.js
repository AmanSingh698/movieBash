const Razorpay = require("razorpay");
const crypto = require("crypto");
const bookingModal = require("../modals/bookingModal");

// Lazy initialization of Razorpay instance
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file"
      );
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

const paymentController = {
  /**
   * POST /api/payments/create-order
   * Create Razorpay order for booking
   */
  createOrder: async (req, res) => {
    try {
      const { amount, bookingDetails } = req.body;
      const userId = req.user?.id;

      if (!amount || !bookingDetails) {
        return res.status(400).json({
          success: false,
          message: "Amount and booking details are required",
        });
      }

      // Create Razorpay order
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: `booking_${Date.now()}`,
        notes: {
          userId: userId,
          showId: bookingDetails.showId,
          seatCount: bookingDetails.seatIds?.length || 0,
        },
      };

      const razorpay = getRazorpayInstance();
      const order = await razorpay.orders.create(options);

      res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID, // Safe to send key_id to frontend
        },
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create payment order",
      });
    }
  },

  /**
   * POST /api/payments/verify
   * Verify Razorpay payment signature and confirm booking
   */
  verifyPayment: async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingDetails,
      } = req.body;

      const userId = req.user?.id;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification details are required",
        });
      }

      // Verify signature
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      // Payment verified successfully - confirm booking
      const { showId, seatIds, sessionId, totalAmount, theatreId } =
        bookingDetails;

      const booking = await bookingModal.confirmBooking(
        showId,
        seatIds,
        sessionId,
        userId,
        totalAmount,
        theatreId
      );

      // Store payment details (you can create a payments table)
      // await paymentModal.storePayment({
      //   bookingId: booking.bookingId,
      //   orderId: razorpay_order_id,
      //   paymentId: razorpay_payment_id,
      //   amount: totalAmount,
      //   status: 'success'
      // })

      res.status(200).json({
        success: true,
        message: "Payment verified and booking confirmed",
        data: {
          bookingId: booking.bookingId,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          seats: booking.seats,
        },
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Payment verification failed",
      });
    }
  },

  /**
   * POST /api/payments/webhook
   * Handle Razorpay webhooks (optional)
   */
  handleWebhook: async (req, res) => {
    try {
      const webhookSignature = req.headers["x-razorpay-signature"];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (webhookSignature !== expectedSignature) {
        return res.status(400).json({ message: "Invalid webhook signature" });
      }

      const event = req.body.event;
      const payload = req.body.payload.payment.entity;

      // Handle different events
      switch (event) {
        case "payment.captured":
          console.log("Payment captured:", payload.id);
          // Update booking status
          break;
        case "payment.failed":
          console.log("Payment failed:", payload.id);
          // Handle failed payment
          break;
        default:
          console.log("Unhandled event:", event);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  },
};

module.exports = paymentController;
