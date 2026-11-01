import { ShoppingBasket } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import PurchaseForm from "@/components/forms/PurchaseForm";

export default function NewPurchasePage() {
  return (
    <>
      <PageHeader group="Purchase / New Purchase" title="Purchase management" />
      <main className="page">
        <FormCard wide title="New Purchase" subtitle="Select a supplier and add one or more products to this purchase." icon={ShoppingBasket} backHref="/purchases" backLabel="Purchase List">
          <PurchaseForm />
        </FormCard>
      </main>
    </>
  );
}
