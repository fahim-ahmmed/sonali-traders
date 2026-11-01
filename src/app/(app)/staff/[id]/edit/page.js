"use client";
import { useParams } from "next/navigation";
import { UserCog } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
import StaffForm from "@/components/forms/StaffForm";

export default function EditStaffPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Staff / Edit Staff" title="Team management" />
      <main className="page">
        <FormCard wide title="Edit Staff" subtitle="Update details, permissions or reset the password." icon={UserCog} backHref={`/staff/${id}`} backLabel="Staff Profile">
          <StaffForm staffId={id} />
        </FormCard>
      </main>
    </>
  );
}
