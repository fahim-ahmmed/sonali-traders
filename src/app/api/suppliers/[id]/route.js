import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { supplierSchema, supplierDto } from "@/lib/supplier-schema";
import Supplier from "@/models/Supplier";
import Purchase from "@/models/Purchase";

export async function GET(_req, { params }) {
  const { error } = await requireAny(["supplier", "purchase"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const s = await Supplier.findById(id).lean();
  if (!s || !s.active) return fail("Supplier not found", 404);
  return ok(supplierDto(s));
}

export async function PUT(req, { params }) {
  const { error } = await requireAny(["supplier"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = supplierSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const s = await Supplier.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!s) return fail("Supplier not found", 404);
  return ok(supplierDto(s));
}

export async function DELETE(_req, { params }) {
  const { error } = await requireAny(["supplier"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  if (await Purchase.exists({ supplierId: id })) return fail("This supplier has purchases, so it can't be deleted", 409);
  await Supplier.findByIdAndDelete(id);
  return ok({ deleted: true });
}
