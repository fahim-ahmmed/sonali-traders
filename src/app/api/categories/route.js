import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail, requireAny, requireUser } from "@/lib/api";
import Category from "@/models/Category";

const schema = z.object({
  category: z.string().trim().min(1, "Category name is required").max(50),
  brand: z.string().trim().min(1, "Brand name is required").max(80),
});

const dto = (c) => ({ id: String(c._id), category: c.category, brand: c.brand });

export async function GET() {
  const { error } = await requireAny(["product", "pos", "purchase", "customer_list"]);
  if (error) return error;
  await connectDB();
  const items = await Category.find().sort({ category: 1, brand: 1 }).lean();
  return ok(items.map(dto));
}

export async function POST(req) {
  const { error } = await requireUser("product");
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const exists = await Category.findOne({
    category: parsed.data.category.toUpperCase(),
    brand: new RegExp(`^${parsed.data.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  if (exists) return fail("This category and brand already exist", 409);
  const c = await Category.create(parsed.data);
  return ok(dto(c), 201);
}