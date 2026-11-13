const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // Monday first
const pad = (n) => String(n).padStart(2, "0");

const parts = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
};
// 0 = Monday ... 6 = Sunday
const mondayIndex = (s) => {
  const { y, m, d } = parts(s);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
};

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(s, n) {
  const { y, m, d } = parts(s);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

// The Monday-to-Sunday week that contains the date.
export const weekDays = (s) =>
  Array.from({ length: 7 }, (_, i) => addDays(s, i - mondayIndex(s)));
export const dayNumber = (s) => Number(s.slice(8));
export const weekdayShort = (s) => DAYS_SHORT[mondayIndex(s)];

// '2026-10-15' -> '15 Oct 2026'
export function formatDate(s) {
  const { y, m, d } = parts(s);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// '2026-11-12' -> 'Thursday, 12 November'
export function formatLong(s) {
  const { y, m, d } = parts(s);
  return `${DAYS_LONG[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}, ${d} ${MONTHS_LONG[m - 1]}`;
}

// Same day -> '15 Oct 2026'; else '1 Oct – 15 Oct 2026'
export function formatRange({ from, to }) {
  if (from === to) return formatDate(from);
  const { d, m, y } = parts(from);
  const start =
    y === Number(to.slice(0, 4)) ? `${d} ${MONTHS[m - 1]}` : formatDate(from);
  return `${start} – ${formatDate(to)}`;
}
