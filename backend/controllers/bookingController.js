const bookingModel = require("../models/bookingModel");

const bookingController = {
  /**
   * GET /api/bookings/seat-map/:showId
   * Get seat map with availability status
   */
  getSeatMap: async (req, res) => {
    try {
      const { showId } = req.params;

      const seatMap = await bookingModel.getSeatMap(showId);

      res.status(200).json({
        success: true,
        data: seatMap,
      });
    } catch (error) {
      console.error("Error fetching seat map:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch seat map",
      });
    }
  },

  /**
   * POST /api/bookings/lock-seats
   * Lock selected seats (requires authentication)
   * Body: { showId, seatIds, sessionId }
   */
  lockSeats: async (req, res) => {
    try {
      const { showId, seatIds, sessionId } = req.body;
      const userId = req.user?.id; // From JWT middleware

      // Validation
      if (
        !showId ||
        !seatIds ||
        !Array.isArray(seatIds) ||
        seatIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid request. showId and seatIds are required",
        });
      }

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "Session ID is required",
        });
      }

      const result = await bookingModel.lockSeats(
        showId,
        seatIds,
        sessionId,
        userId
      );

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error("Error locking seats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to lock seats",
      });
    }
  },

  /**
   * POST /api/bookings/release-seats
   * Release locked seats
   * Body: { showId, seatIds, sessionId }
   */
  releaseSeats: async (req, res) => {
    try {
      const { showId, seatIds, sessionId } = req.body;
      const userId = req.user?.id; // Fix #6: authenticated user from JWT

      if (!showId || !seatIds || !sessionId) {
        return res.status(400).json({
          success: false,
          message: "showId, seatIds, and sessionId are required",
        });
      }

      const result = await bookingModel.releaseSeats(
        showId,
        seatIds,
        sessionId,
        userId  // pass userId so DB filters by owner
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error releasing seats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to release seats",
      });
    }
  },

  /**
   * GET /api/bookings/my-locks/:showId
   * Get user's current locks for a show
   * Query: ?sessionId=xxx
   */
  getUserLocks: async (req, res) => {
    try {
      const { showId } = req.params;
      const { sessionId } = req.query;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "sessionId is required",
        });
      }

      const locks = await bookingModel.getUserLocks(showId, sessionId);

      res.status(200).json({
        success: true,
        data: locks,
      });
    } catch (error) {
      console.error("Error fetching user locks:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch locks",
      });
    }
  },

  /**
   * POST /api/bookings/confirm
   * Confirm booking and create transaction
   * Body: { showId, seatIds, sessionId, totalAmount, theatreId }
   */
  confirmBooking: async (req, res) => {
    try {
      const { showId, seatIds, sessionId, totalAmount, theatreId } = req.body;
      const userId = req.user?.id; // From JWT middleware

      // Validation
      if (!showId || !seatIds || !sessionId || !totalAmount || !theatreId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User must be authenticated to confirm booking",
        });
      }

      const result = await bookingModel.confirmBooking(
        showId,
        seatIds,
        sessionId,
        userId,
        totalAmount,
        theatreId
      );

      res.status(201).json({
        success: true,
        message: "Booking confirmed successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error confirming booking:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to confirm booking",
      });
    }
  },

  /**
   * DELETE /api/bookings/cleanup-expired
   * Cleanup expired locks (for cron job or manual trigger)
   */
  cleanupExpiredLocks: async (req, res) => {
    try {
      const result = await bookingModel.cleanupExpiredLocks();

      res.status(200).json({
        success: true,
        message: `Cleaned up ${result.deletedCount} expired locks`,
        data: result,
      });
    } catch (error) {
      console.error("Error cleaning up expired locks:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cleanup expired locks",
      });
    }
  },

  /**
   * GET /api/bookings/:id
   * Get booking details
   */
  getBookingDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await bookingModel.getBookingDetails(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      console.error("Error fetching booking details:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch booking details",
      });
    }
  },

  /**
   * GET /api/bookings/user/history
   * Get all bookings for the authenticated user
   */
  getUserBookings: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User must be authenticated",
        });
      }

      const bookings = await bookingModel.getUserBookings(userId);

      res.status(200).json({
        success: true,
        data: bookings,
        count: bookings.length,
      });
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch bookings",
      });
    }
  },
};

module.exports = bookingController;
