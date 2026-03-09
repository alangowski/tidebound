const fs = require("fs");
const path = require("path");
const pool = require("./pool");

async function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);
  console.log("Database schema initialized");
}

module.exports = { initializeDatabase };
