import { ok, fail, requireUser } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { buildReport, validKey } from "@/lib/report";

export async function GET(req) {
  const { error } = await requireUser("admin");
  if (error) return error;
  const date = new URL(req.url).searchParams.get("date");
  if (!validKey(date)) return fail("Choose a valid date", 422);
  await connectDB();
  return ok(await buildReport(date, date));
}
