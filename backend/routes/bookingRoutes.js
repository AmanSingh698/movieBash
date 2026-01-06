const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const authenticateJWT = require("../middlewares/authMiddleware");

// Public route - Get seat map (no auth required to view)
router.get("/seat-map/:showId", bookingController.getSeatMap);

// Protected routes - Require authentication
router.post("/lock-seats", authenticateJWT, bookingController.lockSeats);
router.post("/release-seats", bookingController.releaseSeats); // Can be called without auth for cleanup
router.get("/my-locks/:showId", bookingController.getUserLocks);
router.post("/confirm", authenticateJWT, bookingController.confirmBooking);

// Admin/Cron route - Cleanup expired locks
router.delete("/cleanup-expired", bookingController.cleanupExpiredLocks);

// Get booking details (protected or public depending on requirement, keeping public for confirmation page for now, or use auth)
// Better to require auth if user is logged in. But for now let's keep it simple or use auth if available.
// Since confirmation page is shown to the user who booked, they should be logged in.
router.get("/:id", authenticateJWT, bookingController.getBookingDetails);

// Get user's booking history
router.get("/user/history", authenticateJWT, bookingController.getUserBookings);

module.exports = router;
