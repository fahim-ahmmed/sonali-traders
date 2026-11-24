import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { isValidDateKey } from "@/lib/dates";
import { withTx, dateFromKey } from "@/lib/tx-core";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";
import Sale from "@/models/Sale";

class UserError extends Error {}

const editSchema = z.object({
  date: z.string().refine(isValidDateKey, "Choose a valid date"),
  debit: z.number().int().min(0), // পয়সা
  credit: z.number().int().min(0), // পয়সা
  description: z.string().trim().max(300).optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
});

const EDITABLE = ["payment", "advance", "opening_due"];

async function adminOnly() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") return fail("Only an administrator can edit or delete ledger entries", 403);
  return null;
}

async function loadEntry(session, customerId, entryId) {
  const entry = await LedgerEntry.findOne({ _id: entryId, partyType: "customer", partyId: customerId }).session(session);
  if (!entry) throw new UserError("Ledger entry not found");
  if (entry.type === "sale") {
    throw new UserError("Sale entries are linked to an invoice and stock, so they can't be edited or deleted from here.");
  }
  if (!EDITABLE.includes(entry.type)) throw new UserError("This kind of ledger entry can't be changed.");
  return entry;
}

// পুরো লেজার আবার ক্রমানুসারে হিসাব করে প্রতিটি balanceAfter ও কাস্টমারের মোট ব্যালেন্স ঠিক করা
async function recompute(session, customerId) {
  const entries = await LedgerEntry.find({ partyType: "customer", partyId: customerId })
    .sort({ date: 1, createdAt: 1, _id: 1 }).session(session).lean();
  let balance = 0;
  const entryWrites = [];
  const saleWrites = [];
  for (const entry of entries) {
    balance += (entry.debit || 0) - (entry.credit || 0);
    if (entry.balanceAfter !== balance) {
      entryWrites.push({ updateOne: { filter: { _id: entry._id }, update: { $set: { balanceAfter: balance } } } });
    }
    if (entry.type === "sale" && entry.refId) {
      saleWrites.push({ updateOne: { filter: { _id: entry.refId }, update: { $set: { dueAfter: balance } } } });
    }
  }
  if (entryWrites.length) await LedgerEntry.bulkWrite(entryWrites, { session, ordered: true });
  if (saleWrites.length) await Sale.bulkWrite(saleWrites, { session, ordered: true });
  await Customer.updateOne({ _id: customerId }, { $set: { balance } }, { session });
  return balance;
}

export async function PUT(req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const denied = await adminOnly();
  if (denied) return denied;
  const { id, entryId } = await params;
  if (!isValidId(id) || !isValidId(entryId)) return fail("Invalid id", 400);
  const parsed = editSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { date, debit, credit, description, note } = parsed.data;

  await connectDB();
  let balance = 0;
  try {
    await withTx(async (session) => {
      const entry = await loadEntry(session, id, entryId);
      if (entry.type === "opening_due") {
        if (!(debit > 0)) throw new UserError("Enter a due amount more than 0");
        entry.debit = debit;
        entry.credit = 0;
      } else {
        // payment / advance
        if (!(credit > 0)) throw new UserError("Enter an amount more than 0");
        entry.debit = 0;
        entry.credit = credit;
      }
      entry.date = dateFromKey(date);
      if (description) entry.description = description;
      entry.note = note;
      await entry.save({ session });
      balance = await recompute(session, id);
    });
  } catch (e) {
    if (e instanceof UserError) return fail(e.message, 422);
    throw e;
  }
  return ok({ balance });
}

export async function DELETE(_req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const denied = await adminOnly();
  if (denied) return denied;
  const { id, entryId } = await params;
  if (!isValidId(id) || !isValidId(entryId)) return fail("Invalid id", 400);

  await connectDB();
  let balance = 0;
  try {
    await withTx(async (session) => {
      const entry = await loadEntry(session, id, entryId);
      await entry.deleteOne({ session });
      balance = await recompute(session, id);
    });
  } catch (e) {
    if (e instanceof UserError) return fail(e.message, 422);
    throw e;
  }
  return ok({ deleted: true, balance });
}