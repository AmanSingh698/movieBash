const pool = require("../services/dbService");

const userModelQueries = {
  login: async (email) => {
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows[0] || null;
    } catch (error) {
      console.error("DB error in userModel.login:", error);
      return null;
    }
  },
  findById: async (id) => {
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
      return rows[0] || null;
    } catch (error) {
      console.error("DB error in userModel.findById:", error);
      return null;
    }
  },
  register: async (name, email, password) => {
    try {
      const [rows] = await pool.query(
        "INSERT INTO users (email, password_hash, name, phone, is_verified, avatar_url, last_login, preferred_city, created_at, updated_at) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NOW(), NOW())",
        [email, password, name],
      );
      return rows;
    } catch (error) {
      console.error("DB error in userModel.register:", error);
      return null;
    }
  },
};

// Refresh Token Model
const RefreshModel = {
  // Store token (matching existing schema)
  storeToken: async (
    jti,
    userId,
    ttlSeconds,
    userAgent = null,
    ipAddress = null,
  ) => {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await pool.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?)",
        [userId, jti, userAgent, ipAddress, expiresAt],
      );
    } catch (err) {
      console.error("Error storing refresh token:", err);
    }
  },

  isValid: async (jti) => {
    try {
      const [rows] = await pool.query(
        "SELECT user_id FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW() AND revoked_at IS NULL",
        [jti],
      );
      return rows.length > 0 ? rows[0].user_id : null;
    } catch (err) {
      console.error("Error validating refresh token:", err);
      return null;
    }
  },

  revoke: async (jti) => {
    try {
      await pool.query(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?",
        [jti],
      );
    } catch (err) {
      console.error("Error revoking refresh token:", err);
    }
  },
};

module.exports = { userModelQueries, RefreshModel };
