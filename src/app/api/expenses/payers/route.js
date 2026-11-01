import { ok, requireUser } from "@/lib/api";
import { users } from "@/lib/users";

// 'Paid by' ড্রপডাউন — Admin ও Staff একই তালিকায়, গ্রুপসহ
export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;
  const rows = await users().find({ active: { $ne: false } }).project({ name: 1, role: 1 }).sort({ name: 1 }).toArray();
  return ok(rows.map((u) => ({ id: String(u._id), name: u.name, role: u.role === "admin" ? "admin" : "staff" })));
}
