import { connectDB } from "@/lib/db";
import { ok, fail, requireAny, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { productSchema, productDto } from "@/lib/product-schema";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function GET(_req, { params }) {
  const { error } = await requireAny(["product", "pos", "purchase"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const p = await Product.findById(id).populate("categoryId", "category brand").lean();
  if (!p || !p.active) return fail("Product not found", 404);
  return ok(productDto({ ...p, brand: p.categoryId?.brand || p.brand, categoryId: p.categoryId?._id }, p.categoryId));
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
  const p = await Product.findOneAndUpdate({ _id: id, active: true }, { ...parsed.data, brand: cat.brand }, { new: true });
  if (!p) return fail("Product not found", 404);
  return ok(productDto(p, cat));
}

export async function DELETE(_req, { params }) {
  const { error } = await requireUser("product");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
  if (!product) return fail("Product not found", 404);
  return ok({ archived: true });
}
