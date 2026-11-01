"use client";
import { useParams } from "next/navigation";
import { ShoppingBasket } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import PurchaseForm from "@/components/forms/PurchaseForm";

export default function EditPurchasePage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Purchase / Edit Purchase" title="Purchase management" />
      <main className="page">
        <FormCard wide title="Edit Purchase" subtitle="Change supplier, products or payment for this purchase." icon={ShoppingBasket} backHref="/purchases" backLabel="Purchase List">
          <PurchaseForm purchaseId={id} />
        </FormCard>
      </main>
    </>
  );
}
