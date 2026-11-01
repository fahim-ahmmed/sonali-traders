import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { productSchema, productDto } from "@/lib/product-schema";
import Category from "@/models/Category";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";
import Purchase from "@/models/Purchase";

export async function GET(_req, { params }) {
  const { error } = await requireUser();
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const p = await Product.findById(id).populate("categoryId", "category").lean();
  if (!p || !p.active) return fail("Product not found", 404);
  return ok(productDto({ ...p, categoryId: p.categoryId?._id }, p.categoryId));
}

export async function PUT(req, { params }) {
  const { error } = await requireUser("product");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const cat = await Category.findById(parsed.data.categoryId);
  if (!cat) return fail("Selected category and brand not found", 422);
  const p = await Product.findByIdAndUpdate(id, { ...parsed.data, brand: cat.brand }, { new: true });
  if (!p) return fail("Product not found", 404);
  return ok(productDto(p, cat));
}

export async function DELETE(_req, { params }) {
  const { error } = await requireUser("product");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  // লেনদেন থাকলে archive (লেজার অক্ষত), না থাকলে মুছে ফেলা
  const used = (await StockMovement.exists({ productId: id })) || (await Purchase.exists({ "items.productId": id }));
  if (used) {
    await Product.findByIdAndUpdate(id, { active: false });
    return ok({ archived: true });
  }
  await Product.findByIdAndDelete(id);
  return ok({ deleted: true });
}
