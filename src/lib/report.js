import { dhakaDayRange } from "./dates";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Expense from "@/models/Expense";
import LedgerEntry from "@/models/LedgerEntry";
import Customer from "@/models/Customer";

const KEY = /^\d{4}-\d{2}-\d{2}$/;
export const validKey = (k) => KEY.test(k || "") && !isNaN(new Date(`${k}T00:00:00+06:00`));
export const rangeOf = (from, to) => ({ $gte: dhakaDayRange(from).start, $lt: dhakaDayRange(to).end });

// শুধু approved বিক্রি গণনায়; Opening Due আলাদা (Sales মোটে বাদ)
export async function buildReport(from, to) {
  const range = rangeOf(from, to);
  const [sales, purchases, expenses, opening] = await Promise.all([
    Sale.find({ status: "approved", date: range }).sort({ date: 1, invoiceNo: 1 }).populate("customerId", "name").lean(),
    Purchase.find({ date: range }).select("grandTotal").lean(),
    Expense.find({ date: range }).sort({ date: 1, createdAt: 1 }).lean(),
    LedgerEntry.find({ partyType: "customer", type: "opening_due", date: range }).sort({ date: 1 }).lean(),
  ]);
  const names = new Map((await Customer.find({ _id: { $in: opening.map((o) => o.partyId) } }).select("name").lean()).map((c) => [String(c._id), c.name]));

  let cement = 0, rod = 0;
  const salesRows = sales.map((s) => {
    for (const i of s.items) { if (i.category === "cement") cement += i.qty; else if (i.category === "rod") rod += i.qty; }
    return {
      id: String(s._id), invoiceNo: s.invoiceNo, date: s.date, customer: s.customerId?.name || "—",
      product: s.items.length ? s.items.map((i) => `${i.name} × ${i.qty}`).join(", ") : "Collection",
      qty: s.items.reduce((a, i) => a + i.qty, 0), total: s.total, paid: s.paid, due: Math.max(s.total - s.paid, 0),
    };
  });
  return {
    from, to,
    totals: {
      sale: sales.reduce((a, s) => a + s.total, 0),
      purchase: purchases.reduce((a, p) => a + p.grandTotal, 0),
      cementQty: cement, rodQty: rod,
      expense: expenses.reduce((a, e) => a + e.amount, 0),
    },
    sales: salesRows,
    opening: opening.map((o) => ({ id: String(o._id), date: o.date, customer: names.get(String(o.partyId)) || "—", amount: o.debit })),
    expenses: expenses.map((e) => ({ id: String(e._id), date: e.date, paidBy: e.paidByName, purpose: e.purpose, note: e.note, amount: e.amount })),
  };
}

// Accounts: Sales, Cost (costSnapshot), Profit, Net Profit = Profit − Expense, Due
export async function buildAccounts(from, to) {
  const range = rangeOf(from, to);
  const [sales, expenses, recv] = await Promise.all([
    Sale.find({ status: "approved", date: range, "items.0": { $exists: true } }).sort({ invoiceNo: 1 }).populate("customerId", "name").lean(),
    Expense.aggregate([{ $match: { date: range } }, { $group: { _id: null, t: { $sum: "$amount" } } }]),
    Customer.aggregate([{ $match: { balance: { $gt: 0 } } }, { $group: { _id: null, t: { $sum: "$balance" }, n: { $sum: 1 } } }]),
  ]);
  const rows = sales.map((s) => {
    const cost = s.items.reduce((a, i) => a + Math.round(i.qty * i.costSnapshot), 0);
    return { id: String(s._id), invoiceNo: s.invoiceNo, date: s.date, customer: s.customerId?.name || "—",
      sales: s.total, cost, profit: s.total - cost, due: Math.max(s.total - s.paid, 0) };
  });
  const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
  const expense = expenses[0]?.t || 0;
  return {
    from, to,
    totals: { sales: sum("sales"), cost: sum("cost"), profit: sum("profit"), due: sum("due"), expense, netProfit: sum("profit") - expense },
    receivable: { amount: recv[0]?.t || 0, customers: recv[0]?.n || 0 }, // বর্তমান সব কাস্টমারের বাকি (রেঞ্জ-নিরপেক্ষ)
    rows,
  };
}
