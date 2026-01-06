// utils/tokenUtil.js
const crypto = require("crypto");

function generateTokenHex(bytes = 32) {
  // returns raw token (hex string)
  return crypto.randomBytes(bytes).toString("hex"); // 64 chars if bytes=32
}

function sha256hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

module.exports = { generateTokenHex, sha256hex };
