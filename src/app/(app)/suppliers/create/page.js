import PageHeader from "@/components/layout/PageHeader";
import SupplierForm from "@/components/forms/SupplierForm";

export default function AddSupplierPage() {
  return (
    <>
      <PageHeader group="Supplier / Add Supplier" title="Supplier management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-2xl p-6">
          <h2 className="text-lg font-bold text-navy-900">Add Supplier</h2>
          <p className="mb-5 text-sm text-slate-500">Save supplier details for purchasing and business records.</p>
          <SupplierForm />
        </div>
      </main>
    </>
  );
}
