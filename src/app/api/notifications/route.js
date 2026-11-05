import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import Sale from "@/models/Sale";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.active === false) {
    return fail("Unauthorized", 401);
  }

  await connectDB();
  const isAdmin = session.user.role === "admin";
  const filter = isAdmin ? {} : { submittedBy: session.user.id };

  const [sales, pendingCount] = await Promise.all([
    Sale.find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(30)
      .populate("customerId", "name phone")
      .lean(),
    Sale.countDocuments(isAdmin ? { status: "pending" } : { submittedBy: session.user.id, status: "pending" }),
  ]);

  const items = sales.map((s) => {
    const total = s.total || 0;
    const paid = s.paid || 0;
    const due = Math.max(total - paid, 0);

    let paymentStatus = "Unpaid";
    if (total === 0 && paid > 0) paymentStatus = "Collection";
    else if (paid >= total && total > 0) paymentStatus = "Paid";
    else if (paid > 0 && paid < total) paymentStatus = "Partial Paid";

    return {
      id: String(s._id),
      invoiceNo: s.invoiceNo || null,
      status: s.status, // "pending" | "approved" | "declined"
      declineNote: s.declineNote || "",
      customerName: s.customerId?.name || "Customer",
      customerId: s.customerId?._id ? String(s.customerId._id) : "",
      submittedBy: s.submittedByName || "Staff",
      date: s.date,
      createdAt: s.createdAt,
      approvedAt: s.approvedAt || s.updatedAt || s.createdAt,
      total,
      paid,
      due,
      paymentStatus,
    };
  });

  return ok({
    role: session.user.role,
    pendingCount,
    items,
  });
}