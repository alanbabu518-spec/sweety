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
const pad = (n) => String(n).padStart(2, "0");

// Today as 'YYYY-MM-DD' in the browser's local timezone.
export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// '2026-10-15' -> '15 Oct 2026'
export function formatDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// Same day -> '15 Oct 2026'; otherwise '1 Oct – 15 Oct 2026' (year only once if shared).
export function formatRange({ from, to }) {
  if (from === to) return formatDate(from);
  const [fy, fm, fd] = from.split("-").map(Number);
  const start =
    fy === Number(to.slice(0, 4))
      ? `${fd} ${MONTHS[fm - 1]}`
      : formatDate(from);
  return `${start} – ${formatDate(to)}`;
}
