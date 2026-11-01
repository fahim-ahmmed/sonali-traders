import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import Sale from "@/models/Sale";

const schema = z.object({ note: z.string().trim().max(200).optional().default("") });

// Decline: কোনো লেজার/স্টক প্রভাব নেই
export async function POST(req, { params }) {
  const { user, error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid note", 422);
  await connectDB();
  const s = await Sale.findOneAndUpdate({ _id: id, status: "pending" }, { $set: { status: "declined", declineNote: parsed.data.note, approvedBy: user.id, approvedAt: new Date() } }, { new: true });
  if (!s) return fail("This request was already processed", 409);
  return ok({ id, status: "declined" });
}
