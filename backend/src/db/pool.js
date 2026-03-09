const { Pool } = require("pg");
const { databaseUrl, nodeEnv } = require("../config/env");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: nodeEnv === "production" ? { rejectUnauthorized: false } : false
});

module.exports = pool;
