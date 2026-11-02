import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { purchaseSchema } from "@/lib/purchase-schema";
import { buildPurchase, applyStock } from "@/lib/purchase";
import { withTx, handleError } from "@/lib/tx";
import { purchaseDto } from "@/lib/purchase-schema";
import Purchase from "@/models/Purchase";

export async function GET(req) {
  const { error } = await requireUser("purchase");
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));
  await connectDB();
  const [items, total] = await Promise.all([
    Purchase.find({ active: { $ne: false } }).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("supplierId", "name company").lean(),
    Purchase.countDocuments({ active: { $ne: false } }),
  ]);
  return ok({ items: items.map((p) => purchaseDto(p, p.supplierId)), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}

export async function POST(req) {
  const { error } = await requireUser("purchase");
  if (error) return error;
  const parsed = purchaseSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  try {
    const p = await withTx(async (session) => {
      const fields = await buildPurchase(parsed.data, session);
      const [doc] = await Purchase.create([fields], { session });
      await applyStock(doc, session);
      return doc;
    });
    return ok({ id: String(p._id) }, 201);
  } catch (e) { return handleError(e); }
}
