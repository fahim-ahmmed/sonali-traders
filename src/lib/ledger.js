import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";
import { AppError } from "./tx";

// balance = Σ debit − Σ credit । সব কাস্টমার-লেনদেন এই একটি ফাংশন দিয়ে (Sale approve-ও ধাপ ৫/৬-এ)
// customer.balance atomic $inc, তাই balanceAfter সবসময় সঠিক।
export async function postEntry(e, session) {
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

export const customerDto = (c) => ({
  id: String(c._id), name: c.name, phone: c.phone, address: c.address, tags: c.tags,
  balance: c.balance, due: Math.max(c.balance, 0), advance: Math.max(-c.balance, 0),
});
