import { UserPlus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import CustomerForm from "@/components/forms/CustomerForm";

export default function AddCustomerPage() {
  return (
    <>
      <PageHeader group="Customer / Add Customer" title="Customer management" />
      <main className="page">
        <FormCard title="Add Customer" subtitle="Create customer contact details." icon={UserPlus} backHref="/customers" backLabel="Customer List">
          <CustomerForm />
        </FormCard>
      </main>
    </>
  );
}
