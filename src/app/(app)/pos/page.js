import { headers } from "next/headers";
import PageHeader from "@/components/layout/PageHeader";
import PosScreen from "@/components/pos/PosScreen";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/dates";

export default async function PosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";
  return (
    <>
      <PageHeader group="Point of Sale" title="Sell products faster">
        <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">{formatDate(new Date(), { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
      </PageHeader>
      <main className="p-4 sm:p-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-navy-900">Point of Sale</h2>
          <p className="text-sm text-slate-500">Create a fast sale and update the customer ledger instantly.</p>
        </div>
        <PosScreen isAdmin={isAdmin} />
      </main>
    </>
  );
}
