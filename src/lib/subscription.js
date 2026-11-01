// মেয়াদ: validUntil-এর দিন শেষ পর্যন্ত বৈধ। ৭ দিনের কম = হলুদ, শেষ = লাল
export function subscriptionStatus(sub, now = new Date()) {
  if (!sub?.validUntil) return { state: "unknown", days: null };
  const endOfDay = new Date(sub.validUntil).getTime() + 24 * 60 * 60 * 1000;
  const days = Math.ceil((endOfDay - now.getTime()) / 86400000);
  return { state: days <= 0 ? "expired" : days <= 7 ? "expiring" : "active", days };
}
