import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { STAFF_PERMISSIONS } from "@/lib/permissions";
import { users } from "@/lib/users";
import Settings from "@/models/Settings";

const schema = z.object({
  staffDefault: z.array(z.enum(STAFF_PERMISSIONS.map((p) => p.key))),
  applyToAll: z.boolean().optional().default(false),
});

export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;
  await connectDB();
  const s = await Settings.findOne({ key: "main" }).lean();
  return ok({ staffDefault: s?.staffDefaultPermissions ?? ["pos"] });
}

export async function PUT(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fail("Invalid permission list", 422);
  await connectDB();
  await Settings.findOneAndUpdate({ key: "main" }, { $set: { staffDefaultPermissions: parsed.data.staffDefault } }, { upsert: true });
  let updated = 0;
  if (parsed.data.applyToAll) {
    const r = await users().updateMany({ role: "staff" }, { $set: { permissions: JSON.stringify(parsed.data.staffDefault) } });
    updated = r.modifiedCount;
  }
  return ok({ staffDefault: parsed.data.staffDefault, updated });
}
