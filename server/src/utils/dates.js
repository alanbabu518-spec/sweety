// True if the string is a valid IANA time zone such as "UTC" or "Asia/Kolkata".
function isValidTimeZone(timeZone) {
  if (typeof timeZone !== "string" || timeZone.trim() === "") {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone,
    });
    return true;
  } catch {
    return false;
  }
}

// Returns today's calendar date in the specified time zone.
// Format: YYYY-MM-DD
function todayString(timeZone = "UTC", now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type) => parts.find((part) => part.type === type).value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Validates a real calendar date in YYYY-MM-DD format.
// Checks leap years and invalid dates such as February 31.
function isValidDateString(dateString) {
  if (typeof dateString !== "string") {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Returns the first day of the given month.
// Example: "2026-10-15" -> "2026-10-01"
function firstOfMonth(dateString) {
  if (!isValidDateString(dateString)) {
    throw new RangeError("Invalid date string. Expected YYYY-MM-DD.");
  }

  return `${dateString.slice(0, 7)}-01`;
}

// Returns the start and end dates of the previous calendar month.
// Example: "2026-10-15" ->
// { from: "2026-09-01", to: "2026-09-30" }
function previousMonthRange(dateString) {
  if (!isValidDateString(dateString)) {
    throw new RangeError("Invalid date string. Expected YYYY-MM-DD.");
  }

  const [year, month] = dateString.split("-").map(Number);

  // First day of the current month.
  const currentMonthStart = new Date(Date.UTC(year, month - 1, 1));

  // Last day of the previous month.
  const previousMonthEnd = new Date(
    currentMonthStart.getTime() - 24 * 60 * 60 * 1000,
  );

  const previousYear = previousMonthEnd.getUTCFullYear();
  const previousMonth = String(previousMonthEnd.getUTCMonth() + 1).padStart(
    2,
    "0",
  );

  const lastDay = String(previousMonthEnd.getUTCDate()).padStart(2, "0");

  return {
    from: `${previousYear}-${previousMonth}-01`,
    to: `${previousYear}-${previousMonth}-${lastDay}`,
  };
}

// Export all utility functions for application code and Jest tests.
module.exports = {
  isValidTimeZone,
  todayString,
  isValidDateString,
  firstOfMonth,
  previousMonthRange,
};
