import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { productSchema, productDto } from "@/lib/product-schema";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function GET(req) {
  // POS/Purchase কম্বো বক্সও ব্যবহার করবে
  const { error } = await requireUser();
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const category = (sp.get("category") || "").trim().toUpperCase();
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));

  await connectDB();
  const filter = { active: true };
  if (q) filter.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (category) {
    const ids = await Category.find({ category }).distinct("_id");
    filter.categoryId = { $in: ids };
  }
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).populate("categoryId", "category").lean(),
    Product.countDocuments(filter),
  ]);
  const data = items.map((p) => productDto({ ...p, categoryId: p.categoryId?._id }, p.categoryId));
  return ok({ items: data, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function POST(req) {
  const { error } = await requireUser("product");
  if (error) return error;
  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const cat = await Category.findById(parsed.data.categoryId);
  if (!cat) return fail("Selected category and brand not found", 422);
  const dup = await Product.findOne({ name: new RegExp(`^${parsed.data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), categoryId: cat._id, brand: cat.brand, active: true });
  if (dup) return fail("A product with this name already exists in this category and brand", 409);
  const p = await Product.create({ ...parsed.data, brand: cat.brand });
  return ok(productDto(p, cat), 201);
}
