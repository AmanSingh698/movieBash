const pool = require("../services/dbService");

const bookingModel = {
  /**
   * Get seat map for a specific show
   * Returns all seats with their current status (available/locked/booked)
   */
  getSeatMap: async (showId) => {
    const connection = await pool.getConnection();
    try {
      // Clean up expired locks first
      await connection.query("DELETE FROM seat_locks WHERE expires_at < NOW()");

      // Get show details
      const [showRows] = await connection.query(
        `SELECT s.*, m.title as movie_title, t.name as theatre_name, sc.name as screen_name
         FROM shows s
         JOIN movies m ON s.movie_id = m.id
         JOIN screens sc ON s.screen_id = sc.id
         JOIN theatres t ON sc.theatre_id = t.id
         WHERE s.id = ?`,
        [showId],
      );

      if (showRows.length === 0) {
        throw new Error("Show not found");
      }

      const show = showRows[0];

      // Get all seats for this screen with their status
      const [seats] = await connection.query(
        `SELECT 
          st.id,
          st.seat_label,
          st.row_label,
          st.col_index,
          st.seat_class,
          st.is_active,
          ssp.price,
          CASE
            WHEN bi.id IS NOT NULL THEN 'booked'
            WHEN sl.id IS NOT NULL THEN 'locked'
            ELSE 'available'
          END as status,
          sl.session_id as locked_by_session,
          sl.user_id as locked_by_user,
          sl.expires_at as lock_expires_at
        FROM seats st
        INNER JOIN show_seat_prices ssp ON ssp.show_id = ? AND ssp.seat_class = st.seat_class
        LEFT JOIN seat_locks sl ON sl.show_id = ? AND sl.seat_id = st.id AND sl.expires_at > NOW()
        LEFT JOIN booking_items bi ON bi.seat_id = st.id 
          AND bi.booking_id IN (
            SELECT id FROM bookings 
            WHERE show_id = ? 
            AND status IN ('confirmed', 'pending')
          )
        WHERE st.screen_id = ? AND st.is_active = 1
        ORDER BY st.row_label, st.col_index`,
        [showId, showId, showId, show.screen_id],
      );

      // Get pricing info
      const [pricing] = await connection.query(
        `SELECT seat_class, price FROM show_seat_prices WHERE show_id = ?`,
        [showId],
      );

      return {
        show: {
          id: show.id,
          movieTitle: show.movie_title,
          theatreName: show.theatre_name,
          screenName: show.screen_name,
          startTime: show.start_time,
          endTime: show.end_time,
          language: show.lang,
          format: show.format,
        },
        seats,
        pricing: pricing.reduce((acc, p) => {
          acc[p.seat_class] = parseFloat(p.price);
          return acc;
        }, {}),
      };
    } finally {
      connection.release();
    }
  },

  /**
   * Lock seats for a user (transaction-safe)
   * Returns successfully locked seats
   */
  lockSeats: async (showId, seatIds, sessionId, userId = null) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clean up expired locks
      await connection.query("DELETE FROM seat_locks WHERE expires_at < NOW()");

      // Set lock expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const lockedSeats = [];
      const failedSeats = [];

      for (const seatId of seatIds) {
        try {
          // Check if seat is already booked
          const [booked] = await connection.query(
            `SELECT bi.id FROM booking_items bi
             JOIN bookings b ON bi.booking_id = b.id
             WHERE b.show_id = ? AND bi.seat_id = ? 
             AND b.status IN ('confirmed', 'pending')`,
            [showId, seatId],
          );

          if (booked.length > 0) {
            failedSeats.push({ seatId, reason: "already_booked" });
            continue;
          }

          // Try to insert lock (will fail if already locked due to unique constraint)
          await connection.query(
            `INSERT INTO seat_locks (show_id, seat_id, session_id, user_id, expires_at)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               session_id = IF(expires_at < NOW(), VALUES(session_id), session_id),
               user_id = IF(expires_at < NOW(), VALUES(user_id), user_id),
               expires_at = IF(expires_at < NOW(), VALUES(expires_at), expires_at)`,
            [showId, seatId, sessionId, userId, expiresAt],
          );

          // Verify the lock belongs to this session
          const [lockCheck] = await connection.query(
            `SELECT id FROM seat_locks 
             WHERE show_id = ? AND seat_id = ? AND session_id = ?`,
            [showId, seatId, sessionId],
          );

          if (lockCheck.length > 0) {
            lockedSeats.push(seatId);
          } else {
            failedSeats.push({ seatId, reason: "locked_by_another_user" });
          }
        } catch (error) {
          console.error("Error locking seat", seatId, ":", error);
          failedSeats.push({ seatId, reason: error.message });
        }
      }

      await connection.commit();

      return {
        success: lockedSeats.length > 0,
        lockedSeats,
        failedSeats,
        expiresAt,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Release locked seats for a session.
   * userId ensures a user can only release their own locks.
   */
  releaseSeats: async (showId, seatIds, sessionId, userId = null) => {
    let sql = `DELETE FROM seat_locks
       WHERE show_id = ? AND seat_id IN (?) AND session_id = ?`;
    const params = [showId, seatIds, sessionId];

    if (userId) {
      sql += ` AND user_id = ?`;
      params.push(userId);
    }

    const [result] = await pool.query(sql, params);

    return {
      success: true,
      releasedCount: result.affectedRows,
    };
  },

  /**
   * Get user's current locks for a show
   */
  getUserLocks: async (showId, sessionId) => {
    await pool.query("DELETE FROM seat_locks WHERE expires_at < NOW()");

    const [locks] = await pool.query(
      `SELECT sl.*, st.seat_label, st.row_label, st.seat_class
       FROM seat_locks sl
       JOIN seats st ON sl.seat_id = st.id
       WHERE sl.show_id = ? AND sl.session_id = ? AND sl.expires_at > NOW()`,
      [showId, sessionId],
    );

    return locks;
  },

  /**
   * Confirm booking (transaction-safe)
   * Creates booking, booking_items, and removes locks atomically.
   * Total is always recalculated from DB — never trusted from client.
   */
  confirmBooking: async (
    showId,
    seatIds,
    sessionId,
    userId,
    totalAmount,
    theatreId,
  ) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Verify locks are still valid and belong to this session
      const [locks] = await connection.query(
        `SELECT seat_id FROM seat_locks 
         WHERE show_id = ? AND seat_id IN (?) AND session_id = ? AND expires_at > NOW()
         FOR UPDATE`,
        [showId, seatIds, sessionId],
      );

      if (locks.length !== seatIds.length) {
        await connection.rollback();
        throw new Error(
          `Some seats are no longer locked or have expired. Found ${locks.length} of ${seatIds.length} seats locked.`,
        );
      }

      // 2. Double-check seats aren't already booked
      const [alreadyBooked] = await connection.query(
        `SELECT bi.seat_id FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         WHERE b.show_id = ? AND bi.seat_id IN (?) 
         AND b.status IN ('confirmed', 'pending')`,
        [showId, seatIds],
      );

      if (alreadyBooked.length > 0) {
        throw new Error("Some seats have already been booked");
      }

      // 3. Get seat details BEFORE creating booking
      const [seatDetails] = await connection.query(
        `SELECT st.id, st.seat_label, st.seat_class, ssp.price
         FROM seats st
         JOIN show_seat_prices ssp ON ssp.seat_class = st.seat_class AND ssp.show_id = ?
         WHERE st.id IN (?)`,
        [showId, seatIds],
      );

      // 4. Recalculate total from DB — never trust client-supplied amount
      const calculatedTotal = seatDetails.reduce(
        (sum, seat) => sum + parseFloat(seat.price),
        0,
      );

      // 5. Create booking
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (user_id, show_id, theatre_id, total_amount, status, booked_at)
         VALUES (?, ?, ?, ?, 'confirmed', NOW())`,
        [userId, showId, theatreId, calculatedTotal],
      );

      const bookingId = bookingResult.insertId;

      // 6. Create booking items
      const bookingItemsValues = seatDetails.map((seat) => [
        bookingId,
        seat.id,
        seat.seat_label,
        seat.seat_class,
        seat.price,
        "confirmed",
      ]);

      await connection.query(
        `INSERT INTO booking_items (booking_id, seat_id, seat_label, seat_class, price, status)
         VALUES ?`,
        [bookingItemsValues],
      );

      // 7. Delete locks
      await connection.query(
        `DELETE FROM seat_locks WHERE show_id = ? AND seat_id IN (?)`,
        [showId, seatIds],
      );

      await connection.commit();

      return {
        success: true,
        bookingId,
        totalAmount: calculatedTotal,
        seats: seatDetails,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Get booking details by ID
   */
  getBookingDetails: async (bookingId) => {
    const [rows] = await pool.query(
      `SELECT b.*, m.title as movie_title, t.name as theatre_name, s.start_time
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN theatres t ON b.theatre_id = t.id
       WHERE b.id = ?`,
      [bookingId],
    );

    if (rows.length === 0) return null;

    const booking = rows[0];

    const [items] = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = ?",
      [bookingId],
    );

    booking.items = items;
    return booking;
  },

  /**
   * Get all bookings for a user.
   * Uses a single batch IN (?) query instead of N+1 loop.
   */
  getUserBookings: async (userId) => {
    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.show_id,
        b.total_amount,
        b.status,
        b.booked_at,
        m.title as movie_title,
        m.poster_url,
        t.name as theatre_name,
        s.start_time,
        s.end_time,
        s.lang as language,
        s.format
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN theatres t ON b.theatre_id = t.id
       WHERE b.user_id = ?
       ORDER BY b.booked_at DESC`,
      [userId],
    );

    if (bookings.length === 0) return bookings;

    const bookingIds = bookings.map((b) => b.id);
    const [allItems] = await pool.query(
      `SELECT booking_id, seat_label, seat_class, price
       FROM booking_items
       WHERE booking_id IN (?)`,
      [bookingIds],
    );

    const itemsByBooking = allItems.reduce((acc, item) => {
      if (!acc[item.booking_id]) acc[item.booking_id] = [];
      acc[item.booking_id].push(item);
      return acc;
    }, {});

    bookings.forEach((booking) => {
      booking.items = itemsByBooking[booking.id] || [];
    });

    return bookings;
  },

  /**
   * Get the server-authoritative total price for a set of seats in a show.
   */
  getSeatsPrice: async (showId, seatIds) => {
    const [rows] = await pool.query(
      `SELECT SUM(ssp.price) AS total
       FROM seats st
       JOIN show_seat_prices ssp ON ssp.seat_class = st.seat_class AND ssp.show_id = ?
       WHERE st.id IN (?)`,
      [showId, seatIds],
    );
    return parseFloat(rows[0]?.total || 0);
  },

  /**
   * Cleanup expired locks (for cron job)
   */
  cleanupExpiredLocks: async () => {
    const [result] = await pool.query(
      "DELETE FROM seat_locks WHERE expires_at < NOW()",
    );

    return {
      success: true,
      deletedCount: result.affectedRows,
    };
  },
};

module.exports = bookingModel;
