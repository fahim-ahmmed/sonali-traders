import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { purchaseSchema, purchaseDto } from "@/lib/purchase-schema";
import { buildPurchase, applyStock, reverseStock } from "@/lib/purchase";
import { withTx, handleError, AppError } from "@/lib/tx";
import Purchase from "@/models/Purchase";

export async function GET(_req, { params }) {
  const { error } = await requireUser("purchase");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const p = await Purchase.findOne({ _id: id, active: { $ne: false } }).populate("supplierId", "name company").lean();
  if (!p) return fail("Purchase not found", 404);
  return ok(purchaseDto(p, p.supplierId));
}

// এডিট = পুরনো স্টক উল্টে নতুন প্রয়োগ (একই transaction-এ)
export async function PUT(req, { params }) {
  const { error } = await requireUser("purchase");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = purchaseSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  try {
    await withTx(async (session) => {
      const old = await Purchase.findOne({ _id: id, active: { $ne: false } }).session(session);
      if (!old) throw new AppError("Purchase not found", 404);
      await reverseStock(old, session);
      const fields = await buildPurchase(parsed.data, session);
      old.set(fields);
      await old.save({ session });
      await applyStock(old, session);
    });
    return ok({ id });
  } catch (e) { return handleError(e); }
}

export async function DELETE(_req, { params }) {
  const { error } = await requireUser("purchase");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  try {
    await withTx(async (session) => {
      const p = await Purchase.findOne({ _id: id, active: { $ne: false } }).session(session);
      if (!p) throw new AppError("Purchase not found", 404);
      await reverseStock(p, session, { preserveHistory: true });
      p.active = false;
      await p.save({ session });
    });
    return ok({ archived: true });
  } catch (e) { return handleError(e); }
}
