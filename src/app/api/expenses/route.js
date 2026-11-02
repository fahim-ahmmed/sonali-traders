import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { dhakaDayRange, isValidDateKey } from "@/lib/dates";
import { dateFromKey } from "@/lib/tx";
import { findUserById } from "@/lib/users";
import { expenseSchema, expenseDto } from "@/lib/expense-schema";
import Expense from "@/models/Expense";

export async function GET(req) {
  const { user, error } = await requireUser("expenses");
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from"), to = sp.get("to");
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));
  await connectDB();
  const filter = { active: { $ne: false } };
  if (user.role !== "admin") filter.paidById = user.id; // স্টাফ শুধু নিজের খরচ দেখে
  if ((from && !isValidDateKey(from)) || (to && !isValidDateKey(to))) return fail("Choose valid dates", 422);
  if (from && to && from > to) return fail("'From' date must be on or before 'To' date", 422);
  if (from) filter.date = { $gte: dhakaDayRange(from).start };
  if (to) filter.date = { ...(filter.date || {}), $lt: dhakaDayRange(to).end };

  const [items, total, sum, purposes] = await Promise.all([
    Expense.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Expense.countDocuments(filter),
    Expense.aggregate([{ $match: filter }, { $group: { _id: null, t: { $sum: "$amount" } } }]),
    Expense.distinct("purpose", { active: { $ne: false }, ...(user.role === "admin" ? {} : { paidById: user.id }) }),
  ]);
  return ok({ items: items.map(expenseDto), total, totalAmount: sum[0]?.t || 0, page, pages: Math.max(1, Math.ceil(total / limit)), purposes: purposes.slice(0, 50) });
}

export async function POST(req) {
  const { user, error } = await requireUser("expenses");
  if (error) return error;
  const parsed = expenseSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;
  await connectDB();

  // স্টাফ সবসময় নিজের নামে; অ্যাডমিন যে কাউকে বাছতে পারে
  let payer = { id: user.id, name: user.name, role: user.role };
  if (user.role === "admin" && d.paidById && d.paidById !== user.id) {
    const u = await findUserById(d.paidById);
    if (!u || u.active === false) return fail("Selected person not found", 422);
    payer = { id: String(u._id), name: u.name, role: u.role };
  }
  const e = await Expense.create({
    date: dateFromKey(d.date), amount: d.amount, purpose: d.purpose, note: d.note,
    paidByType: payer.role === "admin" ? "admin" : "staff", paidById: payer.id, paidByName: payer.name, createdBy: user.id,
  });
  return ok(expenseDto(e), 201);
}
