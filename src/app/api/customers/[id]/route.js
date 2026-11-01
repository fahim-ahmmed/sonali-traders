import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { customerSchema } from "@/lib/customer-schema";
import { customerDto } from "@/lib/ledger";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";

export async function GET(_req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const c = await Customer.findById(id).lean();
  if (!c || !c.active) return fail("Customer not found", 404);
  const entries = await LedgerEntry.find({ partyId: id }).sort({ date: 1, createdAt: 1 }).limit(2000).lean();
  const totalPurchases = entries.filter((e) => e.type === "sale").reduce((s, e) => s + e.debit, 0);
  const totalPayments = entries.reduce((s, e) => s + e.credit, 0);
  return ok({
    customer: customerDto(c),
    summary: { totalPurchases, totalPayments, due: Math.max(c.balance, 0), advance: Math.max(-c.balance, 0) },
    entries: entries.map((e) => ({
      id: String(e._id), date: e.date, type: e.type, description: e.description, qty: e.qty,
      total: e.debit, received: e.credit, balance: e.balanceAfter, note: e.note,
    })),
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
    c.active = false; await c.save(); // লেনদেন আছে → archive
    return ok({ archived: true });
  }
  await c.deleteOne();
  return ok({ deleted: true });
}
