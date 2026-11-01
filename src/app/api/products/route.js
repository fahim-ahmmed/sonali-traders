import { connectDB } from "@/lib/db";
import { ok, fail, requireAny, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { productSchema, productDto } from "@/lib/product-schema";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function GET(req) {
  const { error } = await requireAny(["product", "pos", "purchase"]);
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const category = (sp.get("category") || "").trim().toUpperCase();
  const categoryId = (sp.get("categoryId") || "").trim();
  const activeParam = sp.get("active");
  if (categoryId && !isValidId(categoryId)) return fail("Invalid category id", 400);
  if (activeParam != null && !["0", "1"].includes(activeParam)) return fail("Invalid active filter", 400);
  const active = activeParam == null ? true : activeParam === "1";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));

  await connectDB();
  const filter = { active };
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingCategories = await Category.find({ category: new RegExp(escaped, "i") }).distinct("_id");
    filter.$or = [
      { name: new RegExp(escaped, "i") },
      { brand: new RegExp(escaped, "i") },
      ...(matchingCategories.length ? [{ categoryId: { $in: matchingCategories } }] : []),
    ];
  }
  if (categoryId) filter.categoryId = categoryId;
  if (category) {
    const ids = await Category.find({ category }).distinct("_id");
    if (filter.categoryId) filter.categoryId = { $in: [filter.categoryId].filter((id) => ids.some((item) => String(item) === String(id))) };
    else filter.categoryId = { $in: ids };
  }
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).populate("categoryId", "category brand").lean(),
    Product.countDocuments(filter),
  ]);
  const data = items.map((p) => productDto({ ...p, brand: p.categoryId?.brand || p.brand, categoryId: p.categoryId?._id }, p.categoryId));
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
  const dup = await Product.findOne({ name: new RegExp(`^${parsed.data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"), categoryId: cat._id, brand: cat.brand });
  if (dup) return fail("A product with this name already exists in this category and brand", 409);
  const p = await Product.create({ ...parsed.data, brand: cat.brand });
  return ok(productDto(p, cat), 201);
}
