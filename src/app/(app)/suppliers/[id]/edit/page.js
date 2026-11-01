"use client";
import { useParams } from "next/navigation";
import { Truck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import SupplierForm from "@/components/forms/SupplierForm";

export default function EditSupplierPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Supplier / Edit Supplier" title="Supplier management" />
      <main className="page">
        <FormCard title="Edit Supplier" subtitle="Update supplier contact details." icon={Truck} backHref="/suppliers" backLabel="Supplier List">
          <SupplierForm supplierId={id} />
        </FormCard>
      </main>
    </>
  );
}
