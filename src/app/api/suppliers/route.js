import { connectDB } from "@/lib/db";
import { ok, fail, requireAny } from "@/lib/api";
import { esc } from "@/lib/regex";
import { supplierSchema, supplierDto } from "@/lib/supplier-schema";
import Supplier from "@/models/Supplier";

export async function GET(req) {
  const { error } = await requireAny(["supplier", "purchase"]);
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(200, Math.max(1, Number(sp.get("limit")) || 25));
  await connectDB();
  const filter = { active: true };
  if (q) { const r = new RegExp(esc(q), "i"); filter.$or = [{ name: r }, { company: r }, { phone: r }, { address: r }]; }
  const [items, total] = await Promise.all([
    Supplier.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Supplier.countDocuments(filter),
  ]);
  return ok({ items: items.map(supplierDto), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function POST(req) {
  const { error } = await requireAny(["supplier"]);
  if (error) return error;
  const parsed = supplierSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const s = await Supplier.create(parsed.data);
  return ok(supplierDto(s), 201);
}
