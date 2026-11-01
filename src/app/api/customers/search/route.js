import { connectDB } from "@/lib/db";
import { ok, requireAny } from "@/lib/api";
import { esc } from "@/lib/regex";
import { customerDto } from "@/lib/ledger";
import Customer from "@/models/Customer";

// POS ও Opening-due পিকারের জন্য হালকা সার্চ
export async function GET(req) {
  const { error } = await requireAny(["pos", "customer_list"]);
  if (error) return error;
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  await connectDB();
  const filter = { active: true };
  if (q) { const r = new RegExp(esc(q), "i"); filter.$or = [{ name: r }, { phone: r }]; }
  const items = await Customer.find(filter).sort({ name: 1 }).limit(20).lean();
  return ok(items.map(customerDto));
}
