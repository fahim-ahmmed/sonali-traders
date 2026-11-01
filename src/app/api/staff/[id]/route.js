import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { idMatch, users, sessions } from "@/lib/users";
import { staffUpdateSchema, staffDto } from "@/lib/staff-schema";
import Staff from "@/models/Staff";
import Sale from "@/models/Sale";
import Expense from "@/models/Expense";

export async function GET(_req, { params }) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const s = await Staff.findById(id).lean();
  if (!s || !s.active) return fail("Staff not found", 404);
  const u = await users().findOne({ email: s.email });
  const [sales, expenses] = await Promise.all([
    Sale.find({ submittedBy: s.userId }).sort({ createdAt: -1 }).limit(30).populate("customerId", "name").lean(),
    Expense.find({ paidById: s.userId }).sort({ date: -1 }).limit(30).lean(),
  ]);
  return ok({
    staff: staffDto(s, u),
    sales: sales.map((x) => ({ id: String(x._id), date: x.date, invoiceNo: x.invoiceNo, customer: x.customerId?.name || "", total: x.total, paid: x.paid, status: x.status })),
    expenses: expenses.map((x) => ({ id: String(x._id), date: x.date, purpose: x.purpose, amount: x.amount })),
  });
}

export async function PUT(req, { params }) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = staffUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;
  await connectDB();
  const s = await Staff.findByIdAndUpdate(id, { name: d.name, designation: d.designation, phone: d.phone, salary: d.salary, address: d.address }, { new: true });
  if (!s) return fail("Staff not found", 404);
  await users().updateOne({ email: s.email }, { $set: { name: d.name, permissions: JSON.stringify(d.permissions) } });
  return ok(staffDto(s, { permissions: JSON.stringify(d.permissions) }));
}

// ডিলিট = অ্যাকাউন্ট নিষ্ক্রিয় (জমা দেওয়া sale/expense অক্ষত থাকে)
export async function DELETE(_req, { params }) {
  const { user, error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  const s = await Staff.findById(id);
  if (!s) return fail("Staff not found", 404);
  if (s.userId === user.id) return fail("You can't remove your own account", 409);
  s.active = false; await s.save();
  await users().updateOne({ email: s.email }, { $set: { active: false } });
  await sessions().deleteMany({ userId: idMatch(s.userId) }); // এখনই লগআউট
  return ok({ deactivated: true });
}
