import { ok, fail, requireUser } from "@/lib/api";
import { saleSchema } from "@/lib/sale-schema";
import { approveSale } from "@/lib/sales";
import { withTx, handleError, AppError, dateFromKey } from "@/lib/tx";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import Sale from "@/models/Sale";

// POS জমা: Admin → সরাসরি approved; Staff → pending (Approvals-এ যায়)
export async function POST(req) {
  const { user, error } = await requireUser("pos");
  if (error) return error;
  const parsed = saleSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;

  await connectDB();
  // একই clientRef আবার এলে (ডাবল ক্লিক/রিট্রাই) আগেরটাই ফেরত — ডুপ্লিকেট হয় না
  const existing = await Sale.findOne({ clientRef: d.clientRef }).lean();
  if (existing) return ok({ id: String(existing._id), status: existing.status, invoiceNo: existing.invoiceNo || null, customerId: String(existing.customerId), duplicate: true });

  try {
    const sale = await withTx(async (session) => {
      const customer = await Customer.findById(d.customerId).session(session);
      if (!customer || !customer.active) throw new AppError("Customer not found", 422);

      const ids = [...new Set(d.items.map((i) => i.productId))];
      const products = await Product.find({ _id: { $in: ids }, active: true }).populate("categoryId", "category brand").session(session);
      const pmap = new Map(products.map((p) => [String(p._id), p]));
      const items = d.items.map((i) => {
        const p = pmap.get(i.productId);
        if (!p) throw new AppError("A selected product no longer exists", 422);
        return {
          productId: p._id,
          name: p.name,
          category: p.categoryId?.category || "",
          brand: p.categoryId?.brand || p.brand,
          qty: i.qty,
          rate: i.rate,
          lineTotal: Math.round(i.qty * i.rate),
        };
      });
      const total = items.reduce((s, i) => s + i.lineTotal, 0); // সার্ভারে পুনরায় হিসাব

      const [doc] = await Sale.create([{
        clientRef: d.clientRef, customerId: customer._id, date: dateFromKey(d.date), items, total, paid: d.paid,
        status: "pending", submittedBy: user.id, submittedByName: user.name, remarks: d.remarks, trackNumber: d.trackNumber,
      }], { session });

      if (user.role === "admin") await approveSale(doc, user.id, session);
      return doc;
    });
    return ok({ id: String(sale._id), status: sale.status, invoiceNo: sale.invoiceNo || null, customerId: String(sale.customerId) }, 201);
  } catch (e) { return handleError(e); }
}
