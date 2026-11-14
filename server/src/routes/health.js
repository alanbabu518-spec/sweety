const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

// Liveness: the process is running.
router.get("/", (req, res) => res.json({ status: "ok" }));

// Readiness: the process can actually reach PostgreSQL.
router.get("/ready", async (req, res) => {
  try {
    await pool.query({ text: "SELECT 1", query_timeout: 2000 });
    res.json({ status: "ready", database: "up" });
  } catch (err) {
    console.error("Readiness check failed:", err.message);
    // Details stay in the server log; the response does not leak them.
    res.status(503).json({ status: "unavailable", database: "down" });
  }
});

module.exports = router;
