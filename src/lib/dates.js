// সব 'দিন' Asia/Dhaka ধরে; ডাটাবেসে UTC
export const TZ = "Asia/Dhaka";

export function dhakaDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
}

export function isValidDateKey(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1];
}

export function dhakaDayRange(key = dhakaDateKey()) {
  // বাংলাদেশ UTC+6, DST নেই
  const start = new Date(`${key}T00:00:00+06:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export function formatDate(d, opts = { day: "2-digit", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(new Date(d));
}
