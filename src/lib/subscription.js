import { TZ } from "./dates.js";

// মেয়াদ: validUntil-এর দিন শেষ পর্যন্ত বৈধ। ৭ দিনের কম = হলুদ, শেষ = লাল
export function subscriptionStatus(sub, now = new Date()) {
  if (!sub?.validUntil) return { state: "unknown", days: null };
  const endOfDay = new Date(sub.validUntil).getTime() + 24 * 60 * 60 * 1000;
  const days = Math.ceil((endOfDay - now.getTime()) / 86400000);
  return { state: days <= 0 ? "expired" : days <= 7 ? "expiring" : "active", days };
}

function dhakaDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map(({ type, value }) => [type, value]));
}

function dateSerial({ year, month, day }) {
  return Date.UTC(Number(year), Number(month) - 1, Number(day)) / 86400000;
}

export function nextSubscriptionCycle(validUntil) {
  const baseline = validUntil || new Date("2026-11-10T00:00:00+06:00");
  const current = dhakaDateParts(new Date(baseline));
  const currentYear = Number(current.year);
  const currentMonth = Number(current.month);
  const year = currentMonth === 12 ? currentYear + 1 : currentYear;
  const month = currentMonth === 12 ? 1 : currentMonth + 1;
  const monthText = String(month).padStart(2, "0");

  return {
    validUntil: new Date(`${year}-${monthText}-10T00:00:00+06:00`),
    nextPaymentDate: new Date(`${year}-${monthText}-09T00:00:00+06:00`),
  };
}

export function subscriptionReminder(sub, now = new Date()) {
  if (!sub?.validUntil) return { show: false, daysUntilDue: null };

  const dueDate = sub.nextPaymentDate
    ? dhakaDateParts(new Date(sub.nextPaymentDate))
    : { ...dhakaDateParts(new Date(sub.validUntil)), day: "09" };
  const today = dhakaDateParts(now);
  const daysUntilDue = dateSerial(dueDate) - dateSerial(today);

  return { show: daysUntilDue <= 3, daysUntilDue };
}
