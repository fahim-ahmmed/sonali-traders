import { UserPlus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import StaffForm from "@/components/forms/StaffForm";

export default function AddStaffPage() {
  return (
    <>
      <PageHeader group="Staff / Add New Staff" title="Team management" />
      <main className="page">
        <FormCard wide title="Add New Staff" subtitle="Create a staff account and manage your team members." icon={UserPlus} backHref="/staff" backLabel="Staff List">
          <StaffForm />
        </FormCard>
      </main>
    </>
  );
}
