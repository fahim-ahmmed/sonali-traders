import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { subscriptionReminder } from "@/lib/subscription";
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
  const reminder = isAdmin ? subscriptionReminder(sub) : { show: false };

  return (
    <div className="min-h-screen bg-canvas">
      <Suspense fallback={null}><Sidebar user={user} company={company} pending={pending} /></Suspense>
      <div className="md:pl-64 print:pl-0">
        {reminder.show && (
          <div role="alert" className="no-print sticky top-0 z-30 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-amber-50 px-5 py-2.5 text-center text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-600/20">
            <span aria-hidden="true">⚠️</span>
            <span>Reminder: Your monthly subscription payment is due by the 9th. Please renew to keep your workspace active.</span>
            <Link href="/subscription" className="rounded-full bg-amber-100 px-2.5 py-1 font-bold underline-offset-2 hover:bg-amber-200 hover:underline">Pay Now</Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
