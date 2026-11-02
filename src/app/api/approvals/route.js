import { connectDB } from "@/lib/db";
import { fail, ok, requireUser } from "@/lib/api";
import { dhakaDayRange, isValidDateKey } from "@/lib/dates";
import Sale from "@/models/Sale";

export async function GET(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const status = ["pending", "approved", "declined"].includes(sp.get("status")) ? sp.get("status") : "pending";
  const staff = sp.get("staff") || "";
  const date = sp.get("date") || "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = 20;

  await connectDB();
  const filter = { status };
  if (staff) filter.submittedBy = staff;
  if (date && !isValidDateKey(date)) return fail("Choose a valid date", 422);
  if (date) { const r = dhakaDayRange(date); filter.date = { $gte: r.start, $lt: r.end }; }

  const [items, total, pendingTotal, staffRows] = await Promise.all([
    Sale.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("customerId", "name phone address balance").lean(),
    Sale.countDocuments(filter),
    Sale.countDocuments({ status: "pending" }),
    Sale.aggregate([{ $match: { status } }, { $group: { _id: "$submittedBy", name: { $first: "$submittedByName" } } }]),
  ]);
  return ok({
    items: items.map((s) => ({
      id: String(s._id), createdAt: s.createdAt, date: s.date, submittedBy: s.submittedByName, trackNumber: s.trackNumber, remarks: s.remarks,
      customer: { name: s.customerId?.name || "", phone: s.customerId?.phone || "", address: s.customerId?.address || "", balance: s.customerId?.balance || 0 },
      items: s.items.map((i) => ({ name: i.name, qty: i.qty, rate: i.rate, lineTotal: i.lineTotal })),
      total: s.total, paid: s.paid,
    })),
    total, pendingTotal, page, pages: Math.max(1, Math.ceil(total / limit)),
    staff: staffRows.map((r) => ({ id: r._id, name: r.name })),
  });
}
