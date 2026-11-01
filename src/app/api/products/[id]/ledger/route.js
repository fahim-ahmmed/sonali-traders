import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import Product from "@/models/Product";
import StockMovement from "@/models/StockMovement";

export async function GET(_req, { params }) {
  const { error } = await requireUser("product");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const p = await Product.findById(id).lean();
  if (!p) return fail("Product not found", 404);

  const moves = await StockMovement.find({ productId: id }).sort({ date: 1, createdAt: 1 }).lean();
  let running = 0;
  const rows = moves.map((m) => {
    running += m.qty;
    return { id: String(m._id), date: m.date, type: m.type, qty: m.qty, note: m.note, balance: running };
  });
  const totalIn = moves.filter((m) => m.qty > 0).reduce((s, m) => s + m.qty, 0);
  const totalOut = moves.filter((m) => m.qty < 0).reduce((s, m) => s + Math.abs(m.qty), 0);
  return ok({
    product: { id: String(p._id), name: p.name, brand: p.brand, stock: p.stock },
    totalIn, totalOut,
    rows: rows.reverse(), // নতুন আগে
  });
}
