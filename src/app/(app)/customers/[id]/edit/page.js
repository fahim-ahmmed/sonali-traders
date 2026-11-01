"use client";
import { useParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import CustomerForm from "@/components/forms/CustomerForm";

export default function EditCustomerPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Customer / Edit Customer" title="Customer management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-2xl p-6">
          <h2 className="mb-5 text-lg font-bold text-navy-900">Edit Customer</h2>
          <CustomerForm customerId={id} />
        </div>
      </main>
    </>
  );
}
