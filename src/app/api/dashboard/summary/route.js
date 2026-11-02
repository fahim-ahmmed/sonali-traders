import { connectDB } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";
import { dhakaDateKey, dhakaDayRange } from "@/lib/dates";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Expense from "@/models/Expense";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";

const sum = (rows, k = "t") => rows[0]?.[k] || 0;

// সব সংখ্যা সার্ভারে হিসাব; 'আজ' = Asia/Dhaka দিন; শুধু approved sale
export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;
  await connectDB();

  const { start, end } = dhakaDayRange(dhakaDateKey());
  const today = { $gte: start, $lt: end };
  const yesterday = { $gte: new Date(start.getTime() - 86400000), $lt: start };

  const [sales, ySale, purchase, ledger, supplierDue, receivable, expense] = await Promise.all([
    Sale.find({ status: "approved", date: today }).select("total items.category items.qty").lean(),
    Sale.aggregate([{ $match: { status: "approved", date: yesterday } }, { $group: { _id: null, t: { $sum: "$total" } } }]),
    Purchase.aggregate([{ $match: { active: { $ne: false }, date: today } }, { $group: { _id: null, t: { $sum: "$grandTotal" } } }]),
    LedgerEntry.aggregate([{ $match: { partyType: "customer", type: { $in: ["sale", "payment"] }, date: today } }, { $group: { _id: "$type", credit: { $sum: "$credit" } } }]),
    Purchase.aggregate([{ $match: { active: { $ne: false } } }, { $group: { _id: null, t: { $sum: { $subtract: ["$grandTotal", "$paidAmount"] } } } }]),
    Customer.aggregate([{ $match: { active: true, balance: { $gt: 0 } } }, { $group: { _id: null, t: { $sum: "$balance" }, n: { $sum: 1 } } }]),
    Expense.aggregate([{ $match: { active: { $ne: false }, date: today } }, { $group: { _id: null, t: { $sum: "$amount" } } }]),
  ]);

  let rod = 0, cement = 0;
  for (const s of sales) for (const i of s.items) {
    const category = String(i.category || "").toUpperCase();
    if (category === "ROD") rod += i.qty;
    else if (category === "CEMENT") cement += i.qty;
  }
  const todaySale = sales.reduce((a, s) => a + s.total, 0);
  const paymentCredit = ledger.find((l) => l._id === "payment")?.credit || 0;
  const saleCredit = ledger.find((l) => l._id === "sale")?.credit || 0;
  const y = sum(ySale);

  return ok({
    todaySale, yesterdaySale: y,
    saleChangePct: y > 0 ? Math.round(((todaySale - y) / y) * 100) : null,
    todayPurchase: sum(purchase),
    receivableDue: sum(receivable), dueCustomerCount: receivable[0]?.n || 0,
    todayDueCollection: paymentCredit,          // Receive Due Payment + কালেকশন-only POS
    totalCollection: paymentCredit + saleCredit, // + বিক্রির সময় পাওয়া paid
    supplierDue: Math.max(sum(supplierDue), 0),
    todayRodSale: rod, todayCementSale: cement,
    todayExpense: sum(expense),
  });
}
