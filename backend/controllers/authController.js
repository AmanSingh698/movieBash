const userModalQueries = require("../modals/authModal");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// parse a TTL string like '7d' '15m' to seconds
function expiryToSeconds(exp) {
  if (!exp) return 7 * 24 * 3600;
  const n = parseInt(exp.slice(0, -1), 10);
  const unit = exp.slice(-1);
  if (unit === "m") return n * 60;
  if (unit === "h") return n * 3600;
  if (unit === "d") return n * 24 * 3600;
  if (unit === "s") return n;
  // fallback: try number
  const num = Number(exp);
  if (!isNaN(num)) return num;
  return 7 * 24 * 3600;
}

async function createAccessToken(user) {
  return jwt.sign(user, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function createRefreshToken(user, jti) {
  return jwt.sign({ ...user, jti }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

// cookie options for refresh token
function refreshCookieOptions(ttlSeconds) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd, // in production, ensure https
    sameSite: "lax", // adjust to 'strict' if needed
    maxAge: ttlSeconds * 1000,
    path: "/api/auth/refresh", // restrict cookie to refresh endpoint (optional)
  };
}

const userAuthController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    try {
      const user = await userModalQueries.login(email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // stored password column is 'pwd' (per your table)
      const hashed = user.password_hash;
      const isMatch = await bcrypt.compare(password, hashed);

      if (isMatch) {
        // remove sensitive data before returning
        const safeUser = { ...user };
        delete safeUser.password_hash;
        const accessToken = await createAccessToken(user);
        res.status(200).json({
          message: "Login Successfull..",
          user: safeUser,
          accessToken,
        });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
  register: async (req, res) => {
    try {
      const { name, email, password, confirmPassword } = req.body;
      console.log(req.body);

      if (!name || !email || !password || !confirmPassword) {
        return res
          .status(400)
          .json({ message: "Name, Email or Password is required" });
      }
      if (password !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "Password and Confirm Password do not match" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await userModalQueries.register(name, email, hashedPassword);
      if (!user) {
        return res.status(401).json({ message: "User Already Exists" });
      }
      return res.status(200).json({ message: "Register Successful" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  async refreshToken(req, res, next) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) return res.status(401).json({ message: "No refresh token" });

      let payload;
      try {
        payload = jwt.verify(token, REFRESH_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const { jti, userId, email } = payload;
      if (!jti || !userId)
        return res.status(401).json({ message: "Invalid token payload" });

      // check jti in Redis
      const storedUserId = await RefreshModel.isValid(jti);
      if (!storedUserId || String(storedUserId) !== String(userId)) {
        // possible token reuse or revoked -> reject
        return res
          .status(401)
          .json({ message: "Refresh token revoked or invalid" });
      }

      // rotate: revoke old jti
      await RefreshModel.revoke(jti);

      // issue new jti + refresh token
      const newJti = uuidv4();
      const newRefreshToken = createRefreshToken({ userId, email }, newJti);
      const ttl = expiryToSeconds(
        process.env.REFRESH_TOKEN_EXPIRES_IN || REFRESH_EXPIRES
      );
      await RefreshModel.storeToken(newJti, userId, ttl);

      // set new refresh cookie
      res.cookie("refreshToken", newRefreshToken, refreshCookieOptions(ttl));

      // issue new access token
      const newAccessToken = createAccessToken({ userId, email });

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        try {
          const payload = jwt.verify(token, REFRESH_SECRET);
          const { jti, userId } = payload;
          if (jti) await RefreshModel.revoke(jti);
        } catch (e) {
          // ignore invalid token on logout
        }
      }

      // clear cookie
      res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
      res.json({ message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },

  generateJWTToken: async (user) => {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    return token;
  },
};

module.exports = userAuthController;
