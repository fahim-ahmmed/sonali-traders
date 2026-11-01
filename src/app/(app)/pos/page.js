import { headers } from "next/headers";
import PageHeader from "@/components/layout/PageHeader";
import PosScreen from "@/components/pos/PosScreen";
import { auth } from "@/lib/auth";

export default async function PosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";
  return (
    <>
      <PageHeader group="Point of Sale" title="Sell products faster" />
      <main className="page">
        <div>
          <h2 className="page-title">Point of Sale</h2>
          <p className="page-subtitle">Create a fast sale and update the customer ledger instantly.</p>
        </div>
        <PosScreen isAdmin={isAdmin} />
      </main>
    </>
  );
}
