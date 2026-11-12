const pool = require("../db/pool");
const { listReadings } = require("./readingsService");
const { firstOfMonth, previousMonthRange } = require("../utils/dates");

// Highest, lowest, average (1 decimal) and count for one user over a date range.
async function getStats(userId, from, to) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count,
            MAX(value)    AS highest,
            MIN(value)    AS lowest,
            ROUND(AVG(value), 1) AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to],
  );
  const r = rows[0];
  if (r.count === 0) {
    return { count: 0, highest: null, lowest: null, average: null };
  }
  return {
    count: r.count,
    highest: r.highest,
    lowest: r.lowest,
    average: Number(r.average), // pg returns NUMERIC as a string
  };
}

async function dailyReport(userId, date) {
  const [stats, readings] = await Promise.all([
    getStats(userId, date, date),
    listReadings(userId, { date }),
  ]);
  return { type: "daily", range: { from: date, to: date }, stats, readings };
}

async function monthToDateReport(userId, date) {
  const from = firstOfMonth(date);
  const stats = await getStats(userId, from, date);
  return { type: "month-to-date", range: { from, to: date }, stats };
}

async function monthlyReport(userId, date) {
  const { from, to } = previousMonthRange(date);
  const stats = await getStats(userId, from, to);
  return { type: "monthly", range: { from, to }, stats };
}

module.exports = { getStats, dailyReport, monthToDateReport, monthlyReport };
