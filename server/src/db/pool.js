const { Pool, types } = require("pg");
const config = require("../config");

// Return DATE columns as plain 'YYYY-MM-DD' strings (no timezone shifting).
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 10000, // allows a Neon database that was asleep to wake up
  idleTimeoutMillis: 30000, // close idle connections before Neon / its pooler does
  keepAlive: true,
});

// Without this handler, an error on an idle connection would crash the whole process.
pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

module.exports = pool;
