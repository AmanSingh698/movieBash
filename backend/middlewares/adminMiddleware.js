// middlewares/adminMiddleware.js
/**
 * Fix #5 — Protects admin-only/cron-job routes with a shared secret key.
 *
 * Usage: set ADMIN_CLEANUP_KEY in your .env, then pass the same value
 * as the `X-Admin-Key` header when calling the protected endpoint.
 *
 * Example (curl):
 *   curl -X DELETE http://localhost:3000/api/bookings/cleanup-expired \
 *        -H "X-Admin-Key: your_secret_key_here"
 */
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_CLEANUP_KEY;

  if (!adminKey) {
    // Env var not configured — fail closed (deny everything)
    return res
      .status(503)
      .json({ message: "Admin endpoint not configured on this server" });
  }

  const provided = req.headers["x-admin-key"];
  if (!provided || provided !== adminKey) {
    return res.status(403).json({ message: "Forbidden: invalid admin key" });
  }

  next();
}

module.exports = requireAdminKey;
