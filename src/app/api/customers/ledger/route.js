import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { isValidDateKey } from "@/lib/dates";
import { withTx, dateFromKey } from "@/lib/tx-core";
import { recalculateCustomerLedger } from "@/lib/ledger";
import LedgerEntry from "@/models/LedgerEntry";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

class UserError extends Error {}

const editSchema = z.object({
  date: z.string().refine(isValidDateKey, "Choose a valid date"),
  debit: z.number().int().min(0), // পয়সা
  credit: z.number().int().min(0), // পয়সা
  description: z.string().trim().max(300).optional().default(""),
  note: z.string().trim().max(200).optional().default(""),
});

const EDITABLE = ["sale", "payment", "advance", "opening_due"];

async function adminOnly() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") return fail("Only an administrator can edit or delete ledger entries", 403);
  return null;
}

// এন্ট্রি ও (থাকলে) তার সাথে যুক্ত Sale ইনভয়েস লোড করা
async function loadEntry(session, customerId, entryId) {
  const entry = await LedgerEntry.findOne({ _id: entryId, partyType: "customer", partyId: customerId }).session(session);
  if (!entry) throw new UserError("Ledger entry not found");
  if (!EDITABLE.includes(entry.type)) throw new UserError("This kind of ledger entry can't be changed.");
  let sale = null;
  if (entry.refId && ["sale", "payment", "advance"].includes(entry.type)) {
    sale = await Sale.findOne({ _id: entry.refId, customerId }).session(session);
  }
  return { entry, sale };
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
      const { entry, sale } = await loadEntry(session, id, entryId);
      const newDate = dateFromKey(date);

      if (entry.type === "opening_due") {
        if (!(debit > 0)) throw new UserError("Enter a due amount more than 0");
        entry.debit = debit;
        entry.credit = 0;
      } else if (entry.type === "sale") {
        // বিক্রির মোট (debit) ইনভয়েস আইটেমের সাথে জড়ানো, তাই অপরিবর্তিত থাকে; শুধু Paid বদলায়
        entry.credit = credit;
      } else {
        // payment / advance
        if (!(credit > 0)) throw new UserError("Enter an amount more than 0");
        entry.debit = 0;
        entry.credit = credit;
      }

      entry.date = newDate;
      if (description) entry.description = description;
      entry.note = note;
      await entry.save({ session });

      // যুক্ত ইনভয়েস থাকলে সেটাও মিলিয়ে দেওয়া
      if (sale) {
        sale.date = newDate;
        sale.paid = entry.credit;
        sale.remarks = note;
        await sale.save({ session });
        await StockMovement.updateMany({ refId: sale._id, type: "sale" }, { $set: { date: newDate } }, { session });
      }

      balance = await recalculateCustomerLedger(id, session);
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
      const { entry, sale } = await loadEntry(session, id, entryId);

      if (sale) {
        // বিক্রি মুছলে প্রতিটি আইটেমের স্টক ফেরত যাবে
        for (const it of sale.items || []) {
          await Product.updateOne({ _id: it.productId }, { $inc: { stock: it.qty } }, { session });
        }
        await StockMovement.deleteMany({ refId: sale._id, type: "sale" }, { session });
        await Sale.deleteOne({ _id: sale._id }, { session });
      }

      await LedgerEntry.deleteOne({ _id: entry._id }, { session });
      balance = await recalculateCustomerLedger(id, session);
    });
  } catch (e) {
    if (e instanceof UserError) return fail(e.message, 422);
    throw e;
  }
  return ok({ deleted: true, balance });
}