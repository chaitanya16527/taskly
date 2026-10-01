// All dates are plain "YYYY-MM-DD" strings in LOCAL time.
// Comparing these strings with < and > works correctly, and we never
// convert through UTC, so dates never shift by a day.

const pad = (n) => String(n).padStart(2, "0");

export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getToday() {
  return toDateString(new Date());
}

export function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateString, amount) {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
}

// Local timestamp such as "2026-09-30T20:30:00" (no UTC conversion)
export function nowLocalISO() {
  const now = new Date();
  return `${toDateString(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function isDateInRange(date, start, end) {
  return date >= start && date <= end;
}

export function formatShort(dateString) {
  return parseDate(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLong(dateString) {
  return parseDate(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatWeekdayLong(dateString) {
  return parseDate(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatRange(start, end) {
  return start === end ? formatShort(start) : `${formatShort(start)} – ${formatShort(end)}`;
}

// "19:00" -> "7:00 PM"
export function formatTime(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${pad(minutes)} ${suffix}`;
}

export function formatTimeFromISO(iso) {
  return formatTime(iso.slice(11, 16));
}

export function getDatePart(iso) {
  return iso.slice(0, 10);
}

export function getGreeting(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function getRelativeDateLabel(dateString, today = getToday()) {
  if (dateString === today) return "Today";
  if (dateString === addDays(today, -1)) return "Yesterday";
  return formatLong(dateString);
}

export function getMonthName(year, month) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function shiftMonth(year, month, delta) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

// Returns the cells of a Monday-first month grid (full weeks only).
export function getMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, 1 - offset + i);
    cells.push({ date: toDateString(date), inMonth: date.getMonth() === month });
  }
  return cells;
}
