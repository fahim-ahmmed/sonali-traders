import { connectDB } from "@/lib/db";
import { nativeDb } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { authAdmin } from "@/lib/auth-admin";
import { users } from "@/lib/users";
import { staffCreateSchema, staffDto } from "@/lib/staff-schema";
import Staff from "@/models/Staff";

export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;
  await connectDB();
  const list = await Staff.find({ active: true }).sort({ createdAt: 1 }).lean();
  const urows = await users().find({ email: { $in: list.map((s) => s.email) } }).toArray();
  const umap = new Map(urows.map((u) => [u.email, u]));
  return ok(list.map((s) => staffDto(s, umap.get(s.email))));
}

export async function POST(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const parsed = staffCreateSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;
  await connectDB();

  let created;
  try {
    created = await authAdmin.api.signUpEmail({ body: { email: d.email, password: d.password, name: d.name } });
  } catch {
    return fail("This email is already in use", 409);
  }
  const userId = String(created.user.id);
  await users().updateOne({ email: d.email }, { $set: { role: "staff", permissions: JSON.stringify(d.permissions), active: true } });
  try {
    const s = await Staff.create({ userId, email: d.email, name: d.name, designation: d.designation, phone: d.phone, salary: d.salary, address: d.address });
    return ok(staffDto(s, { permissions: JSON.stringify(d.permissions) }), 201);
  } catch (e) {
    await users().deleteOne({ email: d.email }); // আধা-তৈরি অ্যাকাউন্ট রাখা হয় না
    await nativeDb.collection("account").deleteMany({ accountId: userId });
    console.error(e);
    return fail("Could not create the staff account. Please try again.", 500);
  }
}
