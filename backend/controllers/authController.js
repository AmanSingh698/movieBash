const { userModalQueries, RefreshModel } = require("../modals/authModal");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage",
);

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
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
  };

  // Ensure expiresIn is valid
  const expiresIn = ACCESS_EXPIRES || "15m";

  return jwt.sign(payload, ACCESS_SECRET, { expiresIn });
}

function createRefreshToken(user, jti) {
  const payload = {
    userId: user.id,
    email: user.email,
    jti,
  };

  // Ensure expiresIn is valid
  const expiresIn = REFRESH_EXPIRES || "7d";

  return jwt.sign(payload, REFRESH_SECRET, { expiresIn });
}

// cookie options for refresh token
function refreshCookieOptions(ttlSeconds) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd, // in production, ensure https
    sameSite: "lax", // adjust to 'strict' if needed
    maxAge: ttlSeconds * 1000,
    path: "/api/auth", // restrict cookie to auth endpoints (including logout)
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

        // Generate tokens
        const accessToken = await createAccessToken(user);

        // Generate refresh token
        const jti = uuidv4();
        const refreshToken = createRefreshToken(user, jti);
        const ttl = expiryToSeconds(REFRESH_EXPIRES);

        // Store refresh token in DB
        await RefreshModel.storeToken(
          jti,
          user.id,
          ttl,
          req.headers["user-agent"],
          req.ip,
        );

        // Set refresh token cookie
        res.cookie("refreshToken", refreshToken, refreshCookieOptions(ttl));

        res.json({
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

      // Auto-login after register
      // Fetch full user details again to be sure
      const newUser = await userModalQueries.login(email);

      const accessToken = await createAccessToken(newUser);
      const jti = uuidv4();
      const refreshToken = createRefreshToken(newUser, jti);
      const ttl = expiryToSeconds(REFRESH_EXPIRES);

      await RefreshModel.storeToken(
        jti,
        newUser.id,
        ttl,
        req.headers["user-agent"],
        req.ip,
      );

      res.cookie("refreshToken", refreshToken, refreshCookieOptions(ttl));

      // Remove password hash
      const safeUser = { ...newUser };
      delete safeUser.password_hash;

      return res.status(200).json({
        message: "Register Successful",
        user: safeUser,
        accessToken,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  googleLogin: async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res
          .status(400)
          .json({ message: "Google authorization code is required" });
      }

      // Exchange code for tokens
      const { tokens } = await client.getToken(code);
      const idToken = tokens.id_token;

      if (!idToken) {
        return res
          .status(400)
          .json({ message: "Failed to retrieve ID token from Google" });
      }

      // Verify the ID token
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      if (!email) {
        return res
          .status(400)
          .json({ message: "Email not found in Google token" });
      }

      // Check if user exists
      let user = await userModalQueries.login(email);

      if (!user) {
        // Create new user with random password
        // We need a password for the DB constraint, even if they don't use it.
        const randomPassword = uuidv4();
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        await userModalQueries.register(name, email, hashedPassword);

        // Fetch the newly created user
        user = await userModalQueries.login(email);

        if (!user) {
          return res.status(500).json({ message: "Failed to create user" });
        }
      }

      // Proceed with login flow (tokens)
      const accessToken = await createAccessToken(user);
      const jti = uuidv4();
      const refreshToken = createRefreshToken(user, jti);
      const ttl = expiryToSeconds(REFRESH_EXPIRES);

      await RefreshModel.storeToken(
        jti,
        user.id,
        ttl,
        req.headers["user-agent"],
        req.ip,
      );

      res.cookie("refreshToken", refreshToken, refreshCookieOptions(ttl));

      // Return user info (sanitize password)
      const safeUser = { ...user };
      delete safeUser.password_hash;
      // We might want to update avatar if it's new, but skipping for now to keep it simple

      res.json({
        user: safeUser,
        accessToken,
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(401).json({ message: "Google authentication failed" });
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

      const { jti, userId } = payload;
      if (!jti || !userId)
        return res.status(401).json({ message: "Invalid token payload" });

      // check jti in DB
      const storedUserId = await RefreshModel.isValid(jti);
      if (!storedUserId || String(storedUserId) !== String(userId)) {
        // possible token reuse or revoked -> reject
        return res
          .status(401)
          .json({ message: "Refresh token revoked or invalid" });
      }

      // Fetch user details to ensure they still exist and get latest info
      const user = await userModalQueries.findById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // rotate: revoke old jti
      await RefreshModel.revoke(jti);

      // issue new jti + refresh token
      const newJti = uuidv4();
      const newRefreshToken = createRefreshToken(user, newJti);
      const ttl = expiryToSeconds(
        process.env.REFRESH_TOKEN_EXPIRES_IN || REFRESH_EXPIRES,
      );
      await RefreshModel.storeToken(newJti, userId, ttl);

      // set new refresh cookie
      res.cookie("refreshToken", newRefreshToken, refreshCookieOptions(ttl));

      // issue new access token
      const newAccessToken = await createAccessToken(user);

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
      const isProd = process.env.NODE_ENV === "production";
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/api/auth",
      });
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
      },
    );
    return token;
  },
};

module.exports = userAuthController;
