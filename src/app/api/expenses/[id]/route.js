import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { dateFromKey } from "@/lib/tx";
import { findUserById } from "@/lib/users";
import { expenseSchema, expenseDto } from "@/lib/expense-schema";
import Expense from "@/models/Expense";

export async function PUT(req, { params }) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = expenseSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;
  await connectDB();
  const set = { date: dateFromKey(d.date), amount: d.amount, purpose: d.purpose, note: d.note };
  if (d.paidById) {
    const u = await findUserById(d.paidById);
    if (!u) return fail("Selected person not found", 422);
    Object.assign(set, { paidById: String(u._id), paidByName: u.name, paidByType: u.role === "admin" ? "admin" : "staff" });
  }
  const e = await Expense.findByIdAndUpdate(id, set, { new: true });
  if (!e) return fail("Expense not found", 404);
  return ok(expenseDto(e));
}

export async function DELETE(_req, { params }) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  await connectDB();
  await Expense.findByIdAndDelete(id);
  return ok({ deleted: true });
}
