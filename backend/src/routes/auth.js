const { Router } = require("express");
const pool = require("../db/pool");
const { generateToken, signJwt } = require("../services/token");
const { sendMagicLink } = require("../services/email");
const { magicLinkExpiryMinutes } = require("../config/env");

const router = Router();

router.post("/auth/request-magic-link", async (request, response, next) => {
  try {
    const { email } = request.body;

    if (!email || typeof email !== "string") {
      return response.status(400).json({
        status: "error",
        message: "Email is required"
      });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + magicLinkExpiryMinutes * 60 * 1000);

    await pool.query(
      "INSERT INTO magic_links (email, token, expires_at) VALUES ($1, $2, $3)",
      [email.toLowerCase(), token, expiresAt]
    );

    await sendMagicLink(email.toLowerCase(), token);

    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

router.get("/auth/verify", async (request, response, next) => {
  try {
    const { token } = request.query;

    if (!token) {
      return response.status(400).json({
        status: "error",
        message: "Token is required"
      });
    }

    const result = await pool.query(
      "UPDATE magic_links SET used = TRUE WHERE token = $1 AND used = FALSE AND expires_at > NOW() RETURNING email",
      [token]
    );

    if (result.rows.length === 0) {
      return response.status(400).json({
        status: "error",
        message: "Invalid or expired magic link"
      });
    }

    const { email } = result.rows[0];

    const userResult = await pool.query(
      `INSERT INTO users (email, last_login) VALUES ($1, NOW())
       ON CONFLICT (email) DO UPDATE SET last_login = NOW()
       RETURNING id, email`,
      [email]
    );

    const user = userResult.rows[0];
    const jwt = signJwt({ userId: user.id, email: user.email });

    response.json({ status: "ok", token: jwt, user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
