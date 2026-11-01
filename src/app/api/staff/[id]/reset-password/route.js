import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { auth } from "@/lib/auth";
import { isValidId } from "@/lib/ids";
import { idMatch, accounts, sessions } from "@/lib/users";
import { resetSchema } from "@/lib/staff-schema";
import Staff from "@/models/Staff";

export async function POST(req, { params }) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = resetSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const s = await Staff.findById(id).lean();
  if (!s) return fail("Staff not found", 404);
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(parsed.data.password); // হ্যাশড; প্লেইন সংরক্ষিত হয় না
  const r = await accounts().updateOne({ userId: idMatch(s.userId), providerId: "credential" }, { $set: { password: hash } });
  if (!r.matchedCount) return fail("Login account not found for this staff", 404);
  await sessions().deleteMany({ userId: idMatch(s.userId) });
  return ok({ reset: true });
}
