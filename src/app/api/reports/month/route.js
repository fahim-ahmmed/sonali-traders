import { ok, fail, requireUser } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { buildReport } from "@/lib/report";

export async function GET(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const m = new URL(req.url).searchParams.get("month") || "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) return fail("Choose a valid month", 422);
  const [y, mo] = m.split("-").map(Number);
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  await connectDB();
  return ok(await buildReport(`${m}-01`, `${m}-${String(last).padStart(2, "0")}`));
}
