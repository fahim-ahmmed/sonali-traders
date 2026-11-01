import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import PurchaseForm from "@/components/forms/PurchaseForm";

export default function NewPurchasePage() {
  return (
    <>
      <PageHeader group="Purchase / New Purchase" title="Purchase management" />
      <main className="p-5 sm:p-8">
        <Link href="/purchases" className="mb-3 inline-block text-xs font-semibold text-brand-600 hover:underline">← Purchase List</Link>
        <div className="card max-w-4xl p-6">
          <h2 className="text-lg font-bold text-navy-900">New Purchase</h2>
          <p className="mb-5 text-sm text-slate-500">Select a supplier and add one or more products to this purchase.</p>
          <PurchaseForm />
        </div>
      </main>
    </>
  );
}
