const { Pool } = require("pg");
const { databaseUrl, nodeEnv } = require("../config/env");

// Strip sslmode from connection string — pg v8 treats sslmode=require as
// verify-full, which rejects DigitalOcean's self-signed certs. We configure
// SSL explicitly via the ssl option instead.
const connectionString = databaseUrl
  ? databaseUrl.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "")
  : undefined;

const pool = new Pool({
  connectionString,
  ssl: nodeEnv === "production" ? { rejectUnauthorized: false } : false
});

module.exports = pool;
