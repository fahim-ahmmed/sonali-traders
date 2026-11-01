import Product from "@/models/Product";
import Supplier from "@/models/Supplier";
import StockMovement from "@/models/StockMovement";
import { AppError, dateFromKey } from "./tx";

// ফর্মের ডাটা থেকে সার্ভারে পুনরায় হিসাব (ক্লায়েন্টের total বিশ্বাস করা হয় না)
export async function buildPurchase(data, session) {
  const supplier = await Supplier.findById(data.supplierId).session(session);
  if (!supplier || !supplier.active) throw new AppError("Supplier not found", 422);
  const ids = [...new Set(data.items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids }, active: true }).populate("categoryId", "category brand").session(session);
  const map = new Map(products.map((p) => [String(p._id), p]));
  const items = data.items.map((i) => {
    const p = map.get(i.productId);
    if (!p) throw new AppError("A selected product no longer exists", 422);
    return {
      productId: p._id,
      name: p.name,
      category: p.categoryId?.category || "",
      brand: p.categoryId?.brand || p.brand,
      qty: i.qty,
      rate: i.buyPrice,
      buyPrice: i.buyPrice,
      lineTotal: Math.round(i.qty * i.buyPrice),
    };
  });
  const grandTotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const paidAmount = data.paidAmount == null ? grandTotal : Math.min(data.paidAmount, grandTotal);
  return { supplierId: supplier._id, date: dateFromKey(data.date), stockControl: data.stockControl, items, grandTotal, paidAmount };
}

export async function applyStock(p, session) {
  if (!p.stockControl) return;
  for (const it of p.items) {
    await Product.updateOne({ _id: it.productId }, { $inc: { stock: it.qty }, $set: { buyPrice: it.buyPrice } }, { session });
  }
  await StockMovement.insertMany(
    p.items.map((it) => ({ productId: it.productId, date: p.date, type: "purchase", qty: it.qty, refId: p._id, note: "Purchase" })),
    { session }
  );
}

export async function reverseStock(p, session) {
  if (!p.stockControl) return;
  for (const it of p.items) await Product.updateOne({ _id: it.productId }, { $inc: { stock: -it.qty } }, { session });
  await StockMovement.deleteMany({ refId: p._id, type: "purchase" }, { session });
}
