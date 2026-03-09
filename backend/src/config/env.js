require("dotenv").config({ quiet: true });

function parsePort(rawPort) {
  const parsedPort = Number(rawPort);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    return 8080;
  }

  return parsedPort;
}

module.exports = {
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || "onboarding@resend.dev",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  magicLinkExpiryMinutes: Number(process.env.MAGIC_LINK_EXPIRY_MINUTES) || 15
};
