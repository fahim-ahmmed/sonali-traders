import { connectDB } from "@/lib/db";
import { fail, ok, requireUser } from "@/lib/api";
import { paymentPageSchema, subscriptionPaymentSchema } from "@/lib/subscription-payment-schema";
import { subscriptionStatus } from "@/lib/subscription";
import Subscription from "@/models/Subscription";
import SubscriptionPayment from "@/models/SubscriptionPayment";

const PAGE_SIZE = 10;

function paymentDto(payment) {
  return {
    id: String(payment._id),
    method: payment.method,
    senderNumber: payment.senderNumber,
    transactionId: payment.transactionId,
    amount: payment.amount,
    note: payment.note || "",
    status: payment.status,
    submittedAt: payment.submittedAt,
  };
}

export async function GET(request) {
  const { error } = await requireUser("admin");
  if (error) return error;

  const pageResult = paymentPageSchema.safeParse(new URL(request.url).searchParams.get("page") || "1");
  if (!pageResult.success) return fail("Invalid payment history page", 422);
  const page = pageResult.data;

  await connectDB();
  const [subscription, payments, total] = await Promise.all([
    Subscription.findOne({ key: "main" }).lean(),
    SubscriptionPayment.find({}).sort({ submittedAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    SubscriptionPayment.countDocuments({}),
  ]);

  return ok({
    subscription: subscription ? {
      monthlyFee: subscription.monthlyFee,
      validUntil: subscription.validUntil || null,
      nextPaymentDate: subscription.nextPaymentDate || null,
      ...subscriptionStatus(subscription),
    } : null,
    payments: payments.map(paymentDto),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}

export async function POST(request) {
  const { user, error } = await requireUser("admin");
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return fail("Invalid JSON request body", 400);
  }
  const parsed = subscriptionPaymentSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  await connectDB();
  const subscription = await Subscription.findOne({ key: "main" }).select("monthlyFee").lean();
  if (!subscription) return fail("Subscription details have not been set up yet", 409);
  if (!Number.isSafeInteger(subscription.monthlyFee) || subscription.monthlyFee <= 0) {
    return fail("Subscription fee is not configured correctly", 409);
  }

  const details = parsed.data;
  try {
    const payment = await SubscriptionPayment.create({
      ...details,
      amount: subscription.monthlyFee,
      status: "pending",
      submittedBy: String(user.id),
      submittedByName: user.name || "",
      submittedAt: new Date(),
    });
    return ok(paymentDto(payment), 201);
  } catch (e) {
    if (e?.code === 11000) return fail("This transaction ID has already been submitted for this payment method", 409);
    throw e;
  }
}
