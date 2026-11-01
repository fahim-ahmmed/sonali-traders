"use client";
import { useParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import SupplierForm from "@/components/forms/SupplierForm";

export default function EditSupplierPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Supplier / Edit Supplier" title="Supplier management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-2xl p-6">
          <h2 className="mb-5 text-lg font-bold text-navy-900">Edit Supplier</h2>
          <SupplierForm supplierId={id} />
        </div>
      </main>
    </>
  );
}
