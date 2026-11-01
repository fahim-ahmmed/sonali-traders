import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import CustomerForm from "@/components/forms/CustomerForm";

export default function AddCustomerPage() {
  return (
    <>
      <PageHeader group="Customer / Add Customer" title="Customer management" />
      <main className="p-5 sm:p-8">
        <Link href="/customers" className="mb-3 inline-block text-xs font-semibold text-brand-600 hover:underline">← Customer List</Link>
        <div className="card max-w-2xl p-6">
          <h2 className="text-lg font-bold text-navy-900">Add Customer</h2>
          <p className="mb-5 text-sm text-slate-500">Create customer contact details.</p>
          <CustomerForm />
        </div>
      </main>
    </>
  );
}
