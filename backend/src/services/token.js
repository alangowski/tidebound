const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function signJwt(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

function verifyJwt(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { generateToken, signJwt, verifyJwt };
