const pool  = require("../services/dbService");
const redis = require("../services/redisService");

// Seat lock TTL in seconds (default 10 min)
const LOCK_TTL_SEC = (parseInt(process.env.SEAT_LOCK_DURATION_MIN, 10) || 10) * 60;

// Redis key helpers
const seatLockKey  = (showId, seatId)  => `seat_lock:${showId}:${seatId}`;
const seatLockVal  = (sessionId, userId) => `${sessionId}:${userId ?? "anon"}`;
const parseLockVal = (val) => {
  if (!val) return null;
  const [sessionId, userId] = val.split(":");
  return { sessionId, userId: userId === "anon" ? null : userId };
};

const bookingModel = {
  /**
   * GET /api/bookings/seat-map/:showId
   * Returns all seats with status: available | locked | booked.
   *
   * Seat lock status is read from Redis (O(1) per seat).
   * No more DELETE cleanup query on every page load.
   */
  getSeatMap: async (showId) => {
    const connection = await pool.getConnection();
    try {
      // Get show details
      const [showRows] = await connection.query(
        `SELECT s.*, m.title as movie_title, t.name as theatre_name, sc.name as screen_name
         FROM shows s
         JOIN movies m ON s.movie_id = m.id
         JOIN screens sc ON s.screen_id = sc.id
         JOIN theatres t ON sc.theatre_id = t.id
         WHERE s.id = ?`,
        [showId]
      );

      if (showRows.length === 0) throw new Error("Show not found");
      const show = showRows[0];

      // Get all seats — booked status from DB (source of truth)
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
            ELSE 'available'
          END as db_status,
          NULL as locked_by_session,
          NULL as locked_by_user,
          NULL as lock_expires_at
        FROM seats st
        INNER JOIN show_seat_prices ssp ON ssp.show_id = ? AND ssp.seat_class = st.seat_class
        LEFT JOIN seat_locks sl ON sl.show_id = ? AND sl.seat_id = st.id
        LEFT JOIN booking_items bi ON bi.seat_id = st.id
          AND bi.booking_id IN (
            SELECT id FROM bookings
            WHERE show_id = ?
            AND status IN ('confirmed', 'pending')
          )
        WHERE st.screen_id = ? AND st.is_active = 1
        ORDER BY st.row_label, st.col_index`,
        [showId, showId, showId, show.screen_id]
      );

      // Overlay Redis lock status on top of DB seat data
      const seatsWithStatus = await Promise.all(
        seats.map(async (seat) => {
          if (seat.db_status === "booked") {
            return { ...seat, status: "booked" };
          }

          // Check Redis for an active lock on this seat
          const lockVal = await redis.get(seatLockKey(showId, seat.id));
          if (lockVal !== null) {
            const parsed = parseLockVal(JSON.stringify(lockVal)); // lockVal is already parsed by redis.get
            const remainingTtl = await redis.ttl(seatLockKey(showId, seat.id));
            return {
              ...seat,
              status:           "locked",
              locked_by_session: typeof lockVal === "object" ? lockVal.sessionId : lockVal,
              locked_by_user:    typeof lockVal === "object" ? lockVal.userId    : null,
              lock_expires_at:   remainingTtl > 0
                ? new Date(Date.now() + remainingTtl * 1000)
                : null,
            };
          }

          return { ...seat, status: "available" };
        })
      );

      // Get pricing info
      const [pricing] = await connection.query(
        `SELECT seat_class, price FROM show_seat_prices WHERE show_id = ?`,
        [showId]
      );

      return {
        show: {
          id:          show.id,
          movieTitle:  show.movie_title,
          theatreName: show.theatre_name,
          screenName:  show.screen_name,
          startTime:   show.start_time,
          endTime:     show.end_time,
          language:    show.lang,
          format:      show.format,
        },
        seats: seatsWithStatus,
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
   * POST /api/bookings/lock-seats
   * Atomically locks seats using Redis SET NX EX.
   * Falls back to MySQL seat_locks table if Redis is unavailable.
   */
  lockSeats: async (showId, seatIds, sessionId, userId = null) => {
    const redisAvailable = redis.isReady();
    const expiresAt      = new Date(Date.now() + LOCK_TTL_SEC * 1000);
    const lockedSeats    = [];
    const failedSeats    = [];

    if (redisAvailable) {
      // ── Redis path (fast, atomic) ──────────────────────────────────────────
      for (const seatId of seatIds) {
        // 1. Verify seat is not already permanently booked (MySQL)
        const [booked] = await pool.query(
          `SELECT bi.id FROM booking_items bi
           JOIN bookings b ON bi.booking_id = b.id
           WHERE b.show_id = ? AND bi.seat_id = ?
           AND b.status IN ('confirmed', 'pending')`,
          [showId, seatId]
        );

        if (booked.length > 0) {
          failedSeats.push({ seatId, reason: "already_booked" });
          continue;
        }

        // 2. Atomic SET NX EX — only succeeds if key doesn't exist
        const key = seatLockKey(showId, seatId);
        const val = { sessionId, userId };
        const acquired = await redis.setNX(key, JSON.stringify(val), LOCK_TTL_SEC);

        if (acquired === true) {
          lockedSeats.push(seatId);
        } else if (acquired === false) {
          // Key exists — check if it's the same session (re-lock / idempotent)
          const existing = await redis.get(key);
          if (existing && existing.sessionId === sessionId) {
            lockedSeats.push(seatId); // already owned by this session
          } else {
            failedSeats.push({ seatId, reason: "locked_by_another_user" });
          }
        } else {
          // Redis returned null — unavailable for this call
          failedSeats.push({ seatId, reason: "lock_service_unavailable" });
        }
      }
    } else {
      // ── MySQL fallback path ────────────────────────────────────────────────
      console.warn("⚠️  Redis unavailable — falling back to MySQL seat locking");
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Clean up expired locks
        await connection.query("DELETE FROM seat_locks WHERE expires_at < NOW()");

        for (const seatId of seatIds) {
          try {
            const [booked] = await connection.query(
              `SELECT bi.id FROM booking_items bi
               JOIN bookings b ON bi.booking_id = b.id
               WHERE b.show_id = ? AND bi.seat_id = ?
               AND b.status IN ('confirmed', 'pending')`,
              [showId, seatId]
            );

            if (booked.length > 0) {
              failedSeats.push({ seatId, reason: "already_booked" });
              continue;
            }

            await connection.query(
              `INSERT INTO seat_locks (show_id, seat_id, session_id, user_id, expires_at)
               VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 session_id = IF(expires_at < NOW(), VALUES(session_id), session_id),
                 user_id    = IF(expires_at < NOW(), VALUES(user_id),    user_id),
                 expires_at = IF(expires_at < NOW(), VALUES(expires_at), expires_at)`,
              [showId, seatId, sessionId, userId, expiresAt]
            );

            const [lockCheck] = await connection.query(
              `SELECT id FROM seat_locks
               WHERE show_id = ? AND seat_id = ? AND session_id = ?`,
              [showId, seatId, sessionId]
            );

            if (lockCheck.length > 0) {
              lockedSeats.push(seatId);
            } else {
              failedSeats.push({ seatId, reason: "locked_by_another_user" });
            }
          } catch (err) {
            console.error("Error locking seat", seatId, ":", err);
            failedSeats.push({ seatId, reason: err.message });
          }
        }

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    }

    return { success: lockedSeats.length > 0, lockedSeats, failedSeats, expiresAt };
  },

  /**
   * POST /api/bookings/release-seats
   * Deletes Redis lock keys. Falls back to MySQL DELETE.
   */
  releaseSeats: async (showId, seatIds, sessionId, userId = null) => {
    if (redis.isReady()) {
      // Only release locks that belong to this session
      let releasedCount = 0;
      for (const seatId of seatIds) {
        const key = seatLockKey(showId, seatId);
        const existing = await redis.get(key);
        if (existing && existing.sessionId === sessionId) {
          await redis.del(key);
          releasedCount++;
        }
      }
      return { success: true, releasedCount };
    }

    // MySQL fallback
    let sql    = `DELETE FROM seat_locks WHERE show_id = ? AND seat_id IN (?) AND session_id = ?`;
    const params = [showId, seatIds, sessionId];
    if (userId) { sql += ` AND user_id = ?`; params.push(userId); }

    const [result] = await pool.query(sql, params);
    return { success: true, releasedCount: result.affectedRows };
  },

  /**
   * GET /api/bookings/my-locks/:showId?sessionId=xxx
   * Reads from Redis when available.
   */
  getUserLocks: async (showId, sessionId) => {
    if (redis.isReady()) {
      // Scan for all lock keys for this show
      const pattern = `seat_lock:${showId}:*`;
      const matchingKeys = await redis.keys(pattern);

      const locks = [];
      for (const key of matchingKeys) {
        const val = await redis.get(key);
        if (val && val.sessionId === sessionId) {
          const seatId   = key.split(":")[2];
          const remaining = await redis.ttl(key);

          // Fetch seat details from DB
          const [seats] = await pool.query(
            `SELECT id, seat_label, row_label, seat_class FROM seats WHERE id = ?`,
            [seatId]
          );
          if (seats.length > 0) {
            locks.push({
              ...seats[0],
              show_id:    showId,
              session_id: sessionId,
              user_id:    val.userId,
              expires_at: remaining > 0 ? new Date(Date.now() + remaining * 1000) : null,
            });
          }
        }
      }
      return locks;
    }

    // MySQL fallback
    await pool.query("DELETE FROM seat_locks WHERE expires_at < NOW()");
    const [locks] = await pool.query(
      `SELECT sl.*, st.seat_label, st.row_label, st.seat_class
       FROM seat_locks sl
       JOIN seats st ON sl.seat_id = st.id
       WHERE sl.show_id = ? AND sl.session_id = ? AND sl.expires_at > NOW()`,
      [showId, sessionId]
    );
    return locks;
  },

  /**
   * POST /api/bookings/confirm
   * MySQL transaction is still the source of truth for confirmed bookings.
   * Redis locks are deleted after successful commit.
   */
  confirmBooking: async (showId, seatIds, sessionId, userId, totalAmount, theatreId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Verify locks — from Redis when available, else from MySQL
      if (redis.isReady()) {
        const missingLocks = [];
        for (const seatId of seatIds) {
          const val = await redis.get(seatLockKey(showId, seatId));
          if (!val || val.sessionId !== sessionId) {
            missingLocks.push(seatId);
          }
        }
        if (missingLocks.length > 0) {
          await connection.rollback();
          throw new Error(
            `Seat locks expired or not found for seats: ${missingLocks.join(", ")}. Please re-select your seats.`
          );
        }
      } else {
        // MySQL fallback lock verification
        const [locks] = await connection.query(
          `SELECT seat_id FROM seat_locks
           WHERE show_id = ? AND seat_id IN (?) AND session_id = ? AND expires_at > NOW()
           FOR UPDATE`,
          [showId, seatIds, sessionId]
        );
        if (locks.length !== seatIds.length) {
          await connection.rollback();
          throw new Error(
            `Some seats are no longer locked or have expired. Found ${locks.length} of ${seatIds.length} seats locked.`
          );
        }
      }

      // 2. Double-check seats aren't already booked
      const [alreadyBooked] = await connection.query(
        `SELECT bi.seat_id FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         WHERE b.show_id = ? AND bi.seat_id IN (?)
         AND b.status IN ('confirmed', 'pending')`,
        [showId, seatIds]
      );

      if (alreadyBooked.length > 0) {
        throw new Error("Some seats have already been booked");
      }

      // 3. Get seat details from DB
      const [seatDetails] = await connection.query(
        `SELECT st.id, st.seat_label, st.seat_class, ssp.price
         FROM seats st
         JOIN show_seat_prices ssp ON ssp.seat_class = st.seat_class AND ssp.show_id = ?
         WHERE st.id IN (?)`,
        [showId, seatIds]
      );

      // 4. Recalculate total from DB — never trust client-supplied amount
      const calculatedTotal = seatDetails.reduce((sum, seat) => sum + parseFloat(seat.price), 0);

      // 5. Create booking
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (user_id, show_id, theatre_id, total_amount, status, booked_at)
         VALUES (?, ?, ?, ?, 'confirmed', NOW())`,
        [userId, showId, theatreId, calculatedTotal]
      );
      const bookingId = bookingResult.insertId;

      // 6. Create booking items
      const bookingItemsValues = seatDetails.map((seat) => [
        bookingId, seat.id, seat.seat_label, seat.seat_class, seat.price, "confirmed",
      ]);

      await connection.query(
        `INSERT INTO booking_items (booking_id, seat_id, seat_label, seat_class, price, status)
         VALUES ?`,
        [bookingItemsValues]
      );

      // 7. Delete MySQL seat_locks (cleanup / audit)
      await connection.query(
        `DELETE FROM seat_locks WHERE show_id = ? AND seat_id IN (?)`,
        [showId, seatIds]
      );

      await connection.commit();

      // 8. Release Redis locks after successful commit
      if (redis.isReady()) {
        for (const seatId of seatIds) {
          await redis.del(seatLockKey(showId, seatId));
        }
      }

      return { success: true, bookingId, totalAmount: calculatedTotal, seats: seatDetails };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * GET /api/bookings/:id — Booking details by ID
   */
  getBookingDetails: async (bookingId) => {
    const [rows] = await pool.query(
      `SELECT b.*, m.title as movie_title, t.name as theatre_name, s.start_time
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN theatres t ON b.theatre_id = t.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (rows.length === 0) return null;
    const booking = rows[0];

    const [items] = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = ?",
      [bookingId]
    );
    booking.items = items;
    return booking;
  },

  /**
   * GET /api/bookings/user/history
   * Batch query — no N+1 loop.
   */
  getUserBookings: async (userId) => {
    const [bookings] = await pool.query(
      `SELECT
        b.id, b.show_id, b.total_amount, b.status, b.booked_at,
        m.title as movie_title, m.poster_url,
        t.name as theatre_name,
        s.start_time, s.end_time, s.lang as language, s.format
       FROM bookings b
       JOIN shows s ON b.show_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN theatres t ON b.theatre_id = t.id
       WHERE b.user_id = ?
       ORDER BY b.booked_at DESC`,
      [userId]
    );

    if (bookings.length === 0) return bookings;

    const bookingIds = bookings.map((b) => b.id);
    const [allItems] = await pool.query(
      `SELECT booking_id, seat_label, seat_class, price
       FROM booking_items
       WHERE booking_id IN (?)`,
      [bookingIds]
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
   * Server-authoritative seat price total.
   */
  getSeatsPrice: async (showId, seatIds) => {
    const [rows] = await pool.query(
      `SELECT SUM(ssp.price) AS total
       FROM seats st
       JOIN show_seat_prices ssp ON ssp.seat_class = st.seat_class AND ssp.show_id = ?
       WHERE st.id IN (?)`,
      [showId, seatIds]
    );
    return parseFloat(rows[0]?.total || 0);
  },

  /**
   * DELETE /api/bookings/cleanup-expired
   * Cleans up MySQL seat_locks only — Redis handles its own TTL expiry.
   */
  cleanupExpiredLocks: async () => {
    const [result] = await pool.query(
      "DELETE FROM seat_locks WHERE expires_at < NOW()"
    );
    return { success: true, deletedCount: result.affectedRows };
  },
};

module.exports = bookingModel;
