import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { customerSchema } from "@/lib/customer-schema";
import { customerDto } from "@/lib/ledger";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";

const metricsSchema = z.object({
  manualAvgSale: z.number().int().min(0).nullable().optional(),
  manualLastMonthCollection: z.number().int().min(0).nullable().optional(),
});

export async function GET(_req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const c = await Customer.findById(id).lean();
  if (!c || !c.active) return fail("Customer not found", 404);
  const entries = await LedgerEntry.find({ partyType: "customer", partyId: id })
    .sort({ date: 1, createdAt: 1, _id: 1 }).lean();
  let balance = 0;
  let totalPurchases = 0;
  let totalPayments = 0;
  const rows = entries.map((entry) => {
    balance += (entry.debit || 0) - (entry.credit || 0);
    if (entry.type === "sale") totalPurchases += entry.debit;
    totalPayments += entry.credit;
    return {
      id: String(entry._id), date: entry.date, type: entry.type, description: entry.description, qty: entry.qty,
      total: entry.debit, received: entry.credit, balance, note: entry.note,
    };
  });
  const customer = customerDto({ ...c, balance });
  return ok({
    customer,
    summary: { totalPurchases, totalPayments, due: Math.max(balance, 0), advance: Math.max(-balance, 0) },
    entries: rows,
  });
}

export async function PUT(req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = customerSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const c = await Customer.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!c) return fail("Customer not found", 404);
  return ok(customerDto(c));
}

// ওয়েবসাইট থেকে Average Sale ও Last Month Collection সরাসরি সেট/আপডেট করার রুট
export async function PATCH(req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = metricsSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  await connectDB();
  const update = {};
  if ("manualAvgSale" in parsed.data) update.manualAvgSale = parsed.data.manualAvgSale;
  if ("manualLastMonthCollection" in parsed.data) update.manualLastMonthCollection = parsed.data.manualLastMonthCollection;

  const c = await Customer.findByIdAndUpdate(id, { $set: update }, { new: true });
  if (!c) return fail("Customer not found", 404);
  return ok({
    id: String(c._id),
    manualAvgSale: c.manualAvgSale,
    manualLastMonthCollection: c.manualLastMonthCollection,
  });
}

export async function DELETE(_req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const c = await Customer.findById(id);
  if (!c) return fail("Customer not found", 404);
  if (c.balance !== 0) return fail("This customer still has a due or advance balance. Settle it before deleting.", 409);
  if (await LedgerEntry.exists({ partyId: id })) {
    c.active = false; await c.save();
    return ok({ archived: true });
  }
  await c.deleteOne();
  return ok({ deleted: true });
}