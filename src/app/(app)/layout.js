import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { subscriptionStatus } from "@/lib/subscription";
import Settings from "@/models/Settings";
import Sale from "@/models/Sale";
import Subscription from "@/models/Subscription";
import Sidebar from "@/components/layout/Sidebar";

export default async function AppLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.active === false) redirect("/login");

  await connectDB();
  const isAdmin = session.user.role === "admin";
  const [s, pending, sub] = await Promise.all([
    Settings.findOne({ key: "main" }).lean(),
    isAdmin ? Sale.countDocuments({ status: "pending" }) : 0,
    isAdmin ? Subscription.findOne({ key: "main" }).lean() : null,
  ]);
  const company = { companyName: s?.companyName || "Sonali Trading", logoUrl: s?.logoUrl || "" };
  const user = { name: session.user.name, role: session.user.role, permissions: session.user.permissions, active: session.user.active };
  const st = subscriptionStatus(sub);

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}><Sidebar user={user} company={company} pending={pending} /></Suspense>
      <div className="md:pl-64 print:pl-0">
        {isAdmin && (st.state === "expiring" || st.state === "expired") && (
          <div role="alert" className={`no-print px-5 py-2 text-center text-xs font-semibold ${st.state === "expired" ? "bg-danger text-white" : "bg-warning text-navy-900"}`}>
            {st.state === "expired" ? "Your subscription has expired." : `Your subscription ends in ${st.days} day${st.days === 1 ? "" : "s"}.`}{" "}
            <Link href="/subscription" className="underline">View details</Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
