import { ok, fail, requireAny } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { paymentSchema } from "@/lib/customer-schema";
import { postEntry } from "@/lib/ledger";
import { withTx, handleError, dateFromKey } from "@/lib/tx";

// Receive Due Payment — credit এন্ট্রি। বেশি দিলে balance ঋণাত্মক = Advance
export async function POST(req, { params }) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  const parsed = paymentSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  try {
    const out = await withTx((session) =>
      postEntry({ partyId: id, date: dateFromKey(parsed.data.date), type: "payment", credit: parsed.data.amount, description: "Payment received", note: parsed.data.note }, session)
    );
    return ok({ balance: out.balance }, 201);
  } catch (e) { return handleError(e); }
}
