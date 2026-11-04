import { z } from "zod";
import { ok, fail, requireAny } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { isValidDateKey } from "@/lib/dates";
import { recalculateCustomerLedger } from "@/lib/ledger";
import { withTx, handleError, AppError, dateFromKey } from "@/lib/tx";
import LedgerEntry from "@/models/LedgerEntry";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

const editSchema = z.object({
  date: z.string().refine(isValidDateKey, "Choose a valid date"),
  debit: z.number().int().min(0, "Total/Due amount can't be negative").default(0),
  credit: z.number().int().min(0, "Paid/Received amount can't be negative").default(0),
  description: z.string().trim().max(200).optional().default(""),
  note: z.string().trim().max(300).optional().default(""),
}).refine((d) => d.debit > 0 || d.credit > 0, {
  message: "Enter a valid amount greater than 0",
});

export async function PUT(req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id, entryId } = await params;
  if (!isValidId(id) || !isValidId(entryId)) return fail("Invalid id", 400);

  const parsed = editSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;

  try {
    const balance = await withTx(async (session) => {
      const entry = await LedgerEntry.findOne({ _id: entryId, partyType: "customer", partyId: id }).session(session);
      if (!entry) throw new AppError("Ledger entry not found", 404);

      const newDate = dateFromKey(d.date);
      entry.date = newDate;
      entry.debit = d.debit;
      entry.credit = d.credit;
      if (d.description) entry.description = d.description;
      entry.note = d.note;
      await entry.save({ session });

      if (entry.refId) {
        await Sale.updateOne(
          { _id: entry.refId },
          { $set: { date: newDate, total: d.debit, paid: d.credit, remarks: d.note } },
          { session }
        );
      }

      return recalculateCustomerLedger(id, session);
    });
    return ok({ balance });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id, entryId } = await params;
  if (!isValidId(id) || !isValidId(entryId)) return fail("Invalid id", 400);

  try {
    const balance = await withTx(async (session) => {
      const entry = await LedgerEntry.findOne({ _id: entryId, partyType: "customer", partyId: id }).session(session);
      if (!entry) throw new AppError("Ledger entry not found", 404);

      // যদি এটি কোনো সেল এন্ট্রি হয়, তবে স্টক ফিরিয়ে দেওয়া এবং সেল রেকর্ড মুছে ফেলা হবে
      if (entry.refId) {
        const sale = await Sale.findById(entry.refId).session(session);
        if (sale) {
          if (!sale.historicalImport && sale.items?.length) {
            for (const item of sale.items) {
              await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.qty } }, { session });
            }
            await StockMovement.deleteMany({ refId: sale._id }, { session });
          }
          await sale.deleteOne({ session });
        }
      }

      await entry.deleteOne({ session });
      return recalculateCustomerLedger(id, session);
    });
    return ok({ deleted: true, balance });
  } catch (e) {
    return handleError(e);
  }
}