import Customer from "../models/Customer.js";
import LedgerEntry from "../models/LedgerEntry.js";
import Sale from "../models/Sale.js";
import { AppError } from "./tx-core.js";

// balance = Σ debit − Σ credit । সব কাস্টমার-লেনদেন এই একটি ফাংশন দিয়ে
export async function postEntry(e, session) {
  if (Array.isArray(e)) return postEntryBatch(e, session);

  const debit = e.debit || 0, credit = e.credit || 0;
  const c = await Customer.findByIdAndUpdate(e.partyId, { $inc: { balance: debit - credit } }, { new: true, session });
  if (!c) throw new AppError("Customer not found", 404);
  const [row] = await LedgerEntry.create(
    [{ partyType: "customer", partyId: e.partyId, date: e.date, type: e.type, debit, credit,
       description: e.description || "", qty: e.qty || "", note: e.note || "", refId: e.refId, balanceAfter: c.balance }],
    { session }
  );
  return { entry: row, balance: c.balance };
}

// এডিট বা ডিলিটের পর কাস্টমারের সম্পূর্ণ লেজার ও ব্যালেন্স পুনরায় হিসাব করে
export async function recalculateCustomerLedger(customerId, session) {
  const entries = await LedgerEntry.find({ partyType: "customer", partyId: customerId })
    .sort({ date: 1, createdAt: 1, _id: 1 })
    .session(session)
    .lean();

  let balance = 0;
  const ledgerUpdates = [];
  const saleUpdates = [];

  for (const entry of entries) {
    balance += (entry.debit || 0) - (entry.credit || 0);
    if (entry.balanceAfter !== balance) {
      ledgerUpdates.push({
        updateOne: { filter: { _id: entry._id }, update: { $set: { balanceAfter: balance } } },
      });
    }
    if (entry.type === "sale" && entry.refId) {
      saleUpdates.push({
        updateOne: { filter: { _id: entry.refId }, update: { $set: { dueAfter: balance } } },
      });
    }
  }

  if (ledgerUpdates.length) await LedgerEntry.bulkWrite(ledgerUpdates, { session, ordered: true });
  if (saleUpdates.length) await Sale.bulkWrite(saleUpdates, { session, ordered: true });

  const updated = await Customer.findByIdAndUpdate(
    customerId,
    { $set: { balance } },
    { new: true, session }
  );
  if (!updated) throw new AppError("Customer not found", 404);
  return balance;
}

async function postEntryBatch(entries, session) {
  if (!session) throw new Error("Batch ledger posting requires a transaction session");
  if (entries.length === 0) return [];
  if (entries.some((entry) => !entry.partyId)) {
    throw new Error("Batch ledger posting received an entry without a customer ID");
  }

  const partyIds = [...new Set(entries.map(({ partyId }) => String(partyId)))];
  const customers = await Customer.find({ _id: { $in: partyIds } }).select("balance").session(session).lean();
  const balances = new Map(customers.map((customer) => [String(customer._id), customer.balance || 0]));
  if (balances.size !== partyIds.length) throw new AppError("Customer not found", 404);

  const balanceDeltas = new Map();
  const ledgerRows = entries.map((entry) => {
    const partyId = String(entry.partyId);
    const debit = entry.debit || 0;
    const credit = entry.credit || 0;
    const balance = balances.get(partyId) + debit - credit;
    balances.set(partyId, balance);
    balanceDeltas.set(partyId, (balanceDeltas.get(partyId) || 0) + debit - credit);
    return {
      partyType: "customer",
      partyId: entry.partyId,
      date: entry.date,
      type: entry.type,
      debit,
      credit,
      description: entry.description || "",
      qty: entry.qty || "",
      note: entry.note || "",
      refId: entry.refId,
      balanceAfter: balance,
    };
  });

  const updateResult = await Customer.bulkWrite(
    [...balanceDeltas].map(([partyId, delta]) => ({
      updateOne: { filter: { _id: partyId }, update: { $inc: { balance: delta } } },
    })),
    { session, ordered: true }
  );
  if (updateResult.matchedCount !== partyIds.length) throw new AppError("Customer not found", 404);

  const rows = await LedgerEntry.insertMany(ledgerRows, { session, ordered: true });
  return rows.map((entry) => ({ entry, balance: entry.balanceAfter }));
}

export const customerDto = (c) => ({
  id: String(c._id), name: c.name, phone: c.phone, address: c.address, tags: c.tags,
  balance: c.balance, due: Math.max(c.balance, 0), advance: Math.max(-c.balance, 0),
});