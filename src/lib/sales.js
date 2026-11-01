import Counter from "@/models/Counter";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import StockMovement from "@/models/StockMovement";
import { postEntry } from "./ledger";

export async function nextInvoiceNo(session) {
  const c = await Counter.findOneAndUpdate({ key: "invoice" }, { $inc: { seq: 1 } }, { new: true, upsert: true, session });
  return `INV-${String(c.seq).padStart(6, "0")}`;
}

// Approve = এক transaction-এ: INV নম্বর • cost snapshot • স্টক কমানো • লেজার • status=approved
// (POS-এ Admin-এর বিক্রি এবং ধাপ ৬-এর Approvals — দুটোই এটি ব্যবহার করে। `sale` একটি Mongoose doc।)
export async function approveSale(sale, approverId, session) {
  const ids = [...new Set(sale.items.map((i) => String(i.productId)))];
  const products = await Product.find({ _id: { $in: ids } }).session(session);
  const pmap = new Map(products.map((p) => [String(p._id), p]));

  sale.invoiceNo = await nextInvoiceNo(session);
  for (const it of sale.items) it.costSnapshot = pmap.get(String(it.productId))?.buyPrice ?? 0;

  // স্টক: ঘাটতি হলেও আটকানো হয় না (বিভাগ ১৪, অনুমান ৩)
  for (const it of sale.items) await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty } }, { session });
  if (sale.items.length) {
    await StockMovement.insertMany(
      sale.items.map((it) => ({ productId: it.productId, date: sale.date, type: "sale", qty: -it.qty, refId: sale._id, note: sale.invoiceNo })),
      { session }
    );
    const cats = [...new Set(sale.items.map((i) => i.category?.toLowerCase()).filter(Boolean))];
    if (cats.length) await Customer.updateOne({ _id: sale.customerId }, { $addToSet: { tags: { $each: cats } } }, { session });
  }

  // লেজার: sale → debit=total, credit=paid; পণ্যহীন = কালেকশন (credit)
  const totalQty = sale.items.reduce((s, i) => s + i.qty, 0);
  const description = sale.items.length
    ? `${sale.invoiceNo} — ${sale.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}`.slice(0, 160)
    : `${sale.invoiceNo} — Collection (POS)`;
  const { balance } = await postEntry(
    { partyId: sale.customerId, date: sale.date, type: sale.items.length ? "sale" : "payment", debit: sale.total, credit: sale.paid,
      description, qty: totalQty ? `${totalQty} pcs` : "", note: sale.remarks, refId: sale._id },
    session
  );

  sale.dueAfter = balance;
  sale.status = "approved";
  sale.approvedBy = approverId;
  sale.approvedAt = new Date();
  await sale.save({ session });
  return sale;
}
