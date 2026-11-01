import { Truck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import SupplierForm from "@/components/forms/SupplierForm";

export default function AddSupplierPage() {
  return (
    <>
      <PageHeader group="Supplier / Add Supplier" title="Supplier management" />
      <main className="page">
        <FormCard title="Add Supplier" subtitle="Save supplier details for purchasing and business records." icon={Truck} backHref="/suppliers" backLabel="Supplier List">
          <SupplierForm />
        </FormCard>
      </main>
    </>
  );
}
