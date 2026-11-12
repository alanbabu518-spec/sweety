const pad = (n) => String(n).padStart(2, "0");

// Today as 'YYYY-MM-DD' in the server's local timezone.
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// True only for real calendar dates in 'YYYY-MM-DD' form (rejects 2026-02-31).
function isValidDateString(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

// '2026-10-15' -> '2026-10-01'
function firstOfMonth(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}

// '2026-10-15' -> { from: '2026-09-01', to: '2026-09-30' }
// Day 0 of a month = last day of the previous month, so JS handles
// 28/29/30/31-day months and the January -> December rollover for us.
function previousMonthRange(dateStr) {
  const [y, m] = dateStr.split("-").map(Number);
  const last = new Date(Date.UTC(y, m - 1, 0));
  const py = last.getUTCFullYear();
  const pm = last.getUTCMonth() + 1;
  return {
    from: `${py}-${pad(pm)}-01`,
    to: `${py}-${pad(pm)}-${pad(last.getUTCDate())}`,
  };
}

module.exports = {
  todayString,
  isValidDateString,
  firstOfMonth,
  previousMonthRange,
};
