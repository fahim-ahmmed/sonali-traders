import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import Settings from "@/models/Settings";

const schema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(100),
  phone: z.string().trim().max(20).optional().default(""),
  hotline: z.string().trim().max(20).optional().default(""),
  address: z.string().trim().max(300).optional().default(""),
});

export async function GET() {
  const { error } = await requireUser(); // যেকোনো লগইন ইউজার
  if (error) return error;
  await connectDB();
  const s = await Settings.findOne({ key: "main" }).lean();
  return ok({ ...s, _id: undefined });
}

export async function PUT(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await connectDB();
  const s = await Settings.findOneAndUpdate({ key: "main" }, { $set: parsed.data }, { new: true, upsert: true }).lean();
  return ok({ ...s, _id: undefined });
}
