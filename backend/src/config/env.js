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
  port: parsePort(process.env.PORT)
};
