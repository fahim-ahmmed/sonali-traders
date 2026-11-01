import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import Category from "@/models/Category";
import Product from "@/models/Product";

const schema = z.object({
  category: z.string().trim().min(1, "Category name is required").max(50),
  brand: z.string().trim().min(1, "Brand name is required").max(80),
});

export async function PUT(req, { params }) {
  const { error } = await requireUser("product");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const dup = await Category.findOne({ _id: { $ne: id }, category: parsed.data.category.toUpperCase(), brand: parsed.data.brand });
  if (dup) return fail("This category and brand already exist", 409);
  const c = await Category.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!c) return fail("Not found", 404);
  await Product.updateMany({ categoryId: id }, { $set: { brand: c.brand } }); // ব্র্যান্ড কপি সিঙ্ক
  return ok({ id: String(c._id), category: c.category, brand: c.brand });
}

export async function DELETE(_req, { params }) {
  const { error } = await requireUser("product");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  if (await Product.exists({ categoryId: id })) {
    return fail("This category is used by products, so it can't be deleted", 409);
  }
  await Category.findByIdAndDelete(id);
  return ok({ deleted: true });
}
