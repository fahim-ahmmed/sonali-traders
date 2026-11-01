// সব টাকা পয়সায় (integer) সংরক্ষিত। ৳600.01 → 60001
export const toPaisa = (taka) => Math.round(Number(taka || 0) * 100);
export const toTaka = (paisa) => Number(paisa || 0) / 100;

// বাংলাদেশি গ্রুপিং: 30405224 → 3,04,05,224
export function formatMoney(paisa, { symbol = true, decimals = 2 } = {}) {
  const n = toTaka(paisa);
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(decimals).split(".");
  let out;
  if (int.length <= 3) out = int;
  else out = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + int.slice(-3);
  if (decimals) out += "." + dec;
  return `${neg ? "-" : ""}${symbol ? "৳" : ""}${out}`;
}
