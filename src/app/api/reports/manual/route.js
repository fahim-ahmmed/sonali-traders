import { ok, fail, requireUser } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { buildReport, validKey } from "@/lib/report";

export async function GET(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from"), to = sp.get("to");
  if (!validKey(from) || !validKey(to)) return fail("Choose both dates", 422);
  if (from > to) return fail("'From' date must be on or before 'To' date", 422);
  await connectDB();
  return ok(await buildReport(from, to));
}
