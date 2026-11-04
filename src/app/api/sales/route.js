import { ok, fail, requireUser } from "@/lib/api";
import { saleSchema } from "@/lib/sale-schema";
import { approveSale } from "@/lib/sales";
import { withTx, handleError, AppError, dateFromKey } from "@/lib/tx";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Sale from "@/models/Sale";

export async function POST(req) {
  const { user, error } = await requireUser("pos");
  if (error) return error;
  const parsed = saleSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;

  try {
    const out = await withTx(async (session) => {
      const existing = await Sale.findOne({ clientRef: d.clientRef }).session(session);
      if (existing) return existing;

      const customer = await Customer.findOne({ _id: d.customerId, active: true }).session(session);
      if (!customer) throw new AppError("Customer not found", 404);

      const pIds = [...new Set(d.items.map((i) => i.productId))];
      const products = pIds.length ? await Product.find({ _id: { $in: pIds }, active: true }).session(session) : [];
      if (products.length !== pIds.length) throw new AppError("One or more products were not found", 404);
      const pMap = new Map(products.map((p) => [String(p._id), p]));

      const cIds = [...new Set(products.map((p) => String(p.categoryId)).filter(Boolean))];
      const categories = cIds.length ? await Category.find({ _id: { $in: cIds } }).session(session) : [];
      const cMap = new Map(categories.map((c) => [String(c._id), c]));

      const items = d.items.map((it) => {
        const p = pMap.get(it.productId);
        const cat = cMap.get(String(p.categoryId));
        const lineTotal = Math.round(it.qty * it.rate);
        return {
          productId: p._id,
          name: p.name,
          category: cat?.category || "",
          brand: p.brand,
          qty: it.qty,
          rate: it.rate,
          lineTotal,
        };
      });

      const itemsSubtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const extraCost = d.extraCost || 0;
      const total = itemsSubtotal + extraCost;

      const [sale] = await Sale.create(
        [{
          clientRef: d.clientRef,
          customerId: customer._id,
          date: dateFromKey(d.date),
          items,
          extraCostLabel: extraCost > 0 ? (d.extraCostLabel || "Extra cost") : "",
          extraCost,
          total,
          paid: d.paid,
          remarks: d.remarks,
          trackNumber: d.trackNumber,
          status: "pending",
          submittedBy: user.id,
          submittedByName: user.name,
        }],
        { session }
      );

      if (user.role === "admin") {
        await approveSale(sale, user.id, session);
      }
      return sale;
    });

    return ok({
      id: String(out._id),
      status: out.status,
      invoiceNo: out.invoiceNo || null,
      customerId: String(out.customerId),
    }, 201);
  } catch (e) {
    return handleError(e);
  }
}