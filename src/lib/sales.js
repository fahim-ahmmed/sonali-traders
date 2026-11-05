import Counter from "@/models/Counter";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import StockMovement from "@/models/StockMovement";
import { postEntry } from "./ledger";
import { formatMoney } from "./money";

export async function nextInvoiceNo(session) {
  const c = await Counter.findOneAndUpdate({ key: "invoice" }, { $inc: { seq: 1 } }, { new: true, upsert: true, session });
  return `INV-${String(c.seq).padStart(6, "0")}`;
}

const unitOf = (cat) => (String(cat || "").toUpperCase() === "ROD" ? "KG" : "pcs");

function formatQtySummary(items) {
  if (!items?.length) return "";
  let rodKg = 0;
  let otherPcs = 0;
  for (const it of items) {
    if (String(it.category || "").toUpperCase() === "ROD") rodKg += Number(it.qty) || 0;
    else otherPcs += Number(it.qty) || 0;
  }
  const parts = [];
  if (otherPcs > 0) parts.push(`${Number(otherPcs.toFixed(2))} pcs`);
  if (rodKg > 0) parts.push(`${Number(rodKg.toFixed(2))} KG`);
  return parts.join(", ");
}

// Approve = এক transaction-এ: INV নম্বর • cost snapshot • স্টক কমানো • লেজার • status=approved
export async function approveSale(sale, approverId, session) {
  const ids = [...new Set(sale.items.map((i) => String(i.productId)))];
  const products = await Product.find({ _id: { $in: ids } }).session(session);
  const pmap = new Map(products.map((p) => [String(p._id), p]));

  sale.invoiceNo = await nextInvoiceNo(session);
  for (const it of sale.items) it.costSnapshot = pmap.get(String(it.productId))?.buyPrice ?? 0;

  // স্টক: ঘাটতি হলেও আটকানো হয় না
  for (const it of sale.items) await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty } }, { session });
  if (sale.items.length) {
    await StockMovement.insertMany(
      sale.items.map((it) => ({ productId: it.productId, date: sale.date, type: "sale", qty: -it.qty, refId: sale._id, note: sale.invoiceNo })),
      { session }
    );
    const catTags = sale.items.map((i) => i.category?.toLowerCase()?.trim()).filter(Boolean);
    const brandTags = sale.items.map((i) => i.brand?.toLowerCase()?.trim()).filter(Boolean);
    const allTags = [...new Set([...catTags, ...brandTags])];
    if (allTags.length) {
      await Customer.updateOne({ _id: sale.customerId }, { $addToSet: { tags: { $each: allTags } } }, { session });
    }
  }

  // লেজার: sale → debit=total, credit=paid; পণ্যহীন = কালেকশন (credit)
  const itemDesc = sale.items.map((i) => `${i.name} × ${i.qty} ${unitOf(i.category)}`).join(", ");
  const extraDesc = sale.extraCost > 0 ? ` + ${sale.extraCostLabel || "Extra Cost"} (${formatMoney(sale.extraCost)})` : "";
  const description = (sale.items.length || sale.extraCost > 0)
    ? `${sale.invoiceNo} — ${itemDesc}${extraDesc}`.slice(0, 160)
    : `${sale.invoiceNo} — Collection (POS)`;

  const { balance } = await postEntry(
    {
      partyId: sale.customerId,
      date: sale.date,
      type: (sale.items.length || sale.extraCost > 0) ? "sale" : "payment",
      debit: sale.total,
      credit: sale.paid,
      description,
      qty: formatQtySummary(sale.items),
      note: sale.remarks,
      refId: sale._id,
    },
    session
  );

  sale.dueAfter = balance;
  sale.status = "approved";
  sale.approvedBy = approverId;
  sale.approvedAt = new Date();
  await sale.save({ session });
  return sale;
}