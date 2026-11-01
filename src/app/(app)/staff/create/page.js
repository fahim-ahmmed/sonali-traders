import PageHeader from "@/components/layout/PageHeader";
import StaffForm from "@/components/forms/StaffForm";

export default function AddStaffPage() {
  return (
    <>
      <PageHeader group="Staff / Add New Staff" title="Team management" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-3xl p-6">
          <h2 className="text-lg font-bold text-navy-900">Add New Staff</h2>
          <p className="mb-5 text-sm text-slate-500">Create a staff account and manage your team members.</p>
          <StaffForm />
        </div>
      </main>
    </>
  );
}
