"use client";
import { useParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import PurchaseForm from "@/components/forms/PurchaseForm";

export default function EditPurchasePage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Purchase / Edit Purchase" title="Purchase management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-4xl p-6">
          <h2 className="mb-5 text-lg font-bold text-navy-900">Edit Purchase</h2>
          <PurchaseForm purchaseId={id} />
        </div>
      </main>
    </>
  );
}
