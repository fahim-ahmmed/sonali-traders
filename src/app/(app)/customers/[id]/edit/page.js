"use client";
import { useParams } from "next/navigation";
import { UserCog } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import CustomerForm from "@/components/forms/CustomerForm";

export default function EditCustomerPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Customer / Edit Customer" title="Customer management" />
      <main className="page">
        <FormCard title="Edit Customer" subtitle="Update name, phone and address." icon={UserCog} backHref={`/customers/${id}`} backLabel="Customer Ledger">
          <CustomerForm customerId={id} />
        </FormCard>
      </main>
    </>
  );
}
