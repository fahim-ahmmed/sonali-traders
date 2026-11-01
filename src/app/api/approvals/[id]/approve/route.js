import { ok, fail, requireUser } from "@/lib/api";
import { isValidId } from "@/lib/ids";
import { approveSale } from "@/lib/sales";
import { withTx, handleError, AppError } from "@/lib/tx";
import Sale from "@/models/Sale";

// একই pending sale দুইবার approve ঠেকানো: শর্তসহ পড়া + transaction write-conflict (retry-তে status ≠ pending → 409)
export async function POST(_req, { params }) {
  const { user, error } = await requireUser("admin");
  if (error) return error;
  const { id } = await params;
  if (!isValidId(id)) return fail("Invalid id", 400);
  try {
    const sale = await withTx(async (session) => {
      const s = await Sale.findOne({ _id: id, status: "pending" }).session(session);
      if (!s) throw new AppError("This request was already processed", 409);
      return approveSale(s, user.id, session);
    });
    return ok({ id, invoiceNo: sale.invoiceNo, status: sale.status });
  } catch (e) { return handleError(e); }
}
