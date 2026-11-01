import { ok, fail, requireAny } from "@/lib/api";
import { openingDueSchema } from "@/lib/customer-schema";
import { postEntry } from "@/lib/ledger";
import { withTx, handleError, dateFromKey } from "@/lib/tx";

// পুরনো বাকি তোলা — Sales মোটে গণ্য নয়, Receivable-এ গণ্য
export async function POST(req) {
  const { error } = await requireAny(["customer_list"]);
  if (error) return error;
  const parsed = openingDueSchema.safeParse(await req.json());
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;
  try {
    const out = await withTx((session) =>
      postEntry({ partyId: d.customerId, date: dateFromKey(d.date), type: "opening_due", debit: d.amount, description: "Opening due balance", note: d.note }, session)
    );
    return ok({ balance: out.balance }, 201);
  } catch (e) { return handleError(e); }
}
