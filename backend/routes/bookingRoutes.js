const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authenticateJWT = require("../middlewares/authMiddleware");
const requireAdminKey = require("../middlewares/adminMiddleware");

// Public route — anyone can view the seat map
router.get("/seat-map/:showId", bookingController.getSeatMap);

// Fix #6: releaseSeats now requires authentication.
// Prevents a third party from releasing another user's locked seats.
router.post("/release-seats", authenticateJWT, bookingController.releaseSeats);

// Protected routes
router.post("/lock-seats", authenticateJWT, bookingController.lockSeats);
router.post("/confirm", authenticateJWT, bookingController.confirmBooking);

// Fix #14 (route ordering bug): /user/history MUST come before /:id,
// otherwise Express catches it as { id: "user" } and the handler is never reached.
router.get("/user/history", authenticateJWT, bookingController.getUserBookings);

// Get booking details by ID
router.get("/:id", authenticateJWT, bookingController.getBookingDetails);

// Fix #5: Cleanup expired locks is now protected by an admin secret key.
// Pass the key as the X-Admin-Key header (safe to call from cron jobs / CI).
router.delete(
  "/cleanup-expired",
  requireAdminKey,
  bookingController.cleanupExpiredLocks
);

module.exports = router;
