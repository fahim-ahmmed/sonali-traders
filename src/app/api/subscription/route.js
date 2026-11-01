import { connectDB } from "@/lib/db";
import { ok, requireUser } from "@/lib/api";
import { subscriptionStatus } from "@/lib/subscription";
import Subscription from "@/models/Subscription";

export async function GET() {
  const { error } = await requireUser("admin");
  if (error) return error;
  await connectDB();
  const s = await Subscription.findOne({ key: "main" }).lean();
  if (!s) return ok(null);
  return ok({ monthlyFee: s.monthlyFee, validUntil: s.validUntil, nextPaymentDate: s.nextPaymentDate, ...subscriptionStatus(s) });
}
