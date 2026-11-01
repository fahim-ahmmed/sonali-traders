// সব 'দিন' Asia/Dhaka ধরে; ডাটাবেসে UTC
export const TZ = "Asia/Dhaka";

export function dhakaDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
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
