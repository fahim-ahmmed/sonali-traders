"use client";
import { useParams } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import StaffForm from "@/components/forms/StaffForm";

export default function EditStaffPage() {
  const { id } = useParams();
  return (
    <>
      <PageHeader group="Staff / Edit Staff" title="Team management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-3xl p-6">
          <h2 className="mb-5 text-lg font-bold text-navy-900">Edit Staff</h2>
          <StaffForm staffId={id} />
        </div>
      </main>
    </>
  );
}
