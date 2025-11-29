// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization header" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, ACCESS_SECRET, (err, payload) => {
    if (err)
      return res.status(401).json({ message: "Invalid or expired token" });
    req.user = payload;
    next();
  });
}

module.exports = authenticateJWT;
