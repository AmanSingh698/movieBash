const mysql = require("mysql2");
const authController = require("../controllers/authController");
const pool = require("../services/dbService");

const userModalQueries = {
  login: async (email) => {
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows[0] || null;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
  register: async (name, email, password) => {
    try {
      const [rows] = await pool.query(
        "INSERT INTO users (email, password_hash, name, phone, is_verified, avatar_url, last_login, preferred_city, created_at, updated_at) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, NOW(), NOW())",
        [email, password, name]
      );
      return rows;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
};

module.exports = userModalQueries;
