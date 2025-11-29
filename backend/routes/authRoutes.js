const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/refresh", authController.refreshToken); // client calls this to get new access token (cookie sent automatically)
router.post("/logout", authController.logout);
module.exports = router;
