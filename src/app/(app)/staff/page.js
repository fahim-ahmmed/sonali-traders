"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/money";

export default function StaffListPage() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { fetch("/api/staff").then((r) => r.json()).then((j) => j.ok ? setItems(j.data) : toast(j.error, "error")); }, [toast]);
  useEffect(load, [load]);

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/staff/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false); setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast("Staff account deactivated"); load();
  }

  return (
    <>
      <PageHeader group="Staff / Staff List" title="Team management" />
      <main className="p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold text-navy-900">Staff List</h2><p className="text-sm text-slate-500">Manage staff profiles, accounts and salaries.</p></div>
          <Link href="/staff/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Add New Staff</Link>
        </div>
        <div className="card overflow-hidden">
          {!items ? <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : !items.length ? <EmptyState title="No staff yet" hint="Create accounts for your sales team." actionHref="/staff/create" actionLabel="Add new staff" />
            : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead><tr><th className="th">Staff name</th><th className="th">Designation</th><th className="th">Phone</th><th className="th">Email</th><th className="th text-right">Salary</th><th className="th text-right">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="td"><span className="font-semibold text-brand-600">{s.name}</span><Link href={`/staff/${s.id}`} className="block text-[11px] text-slate-400 hover:text-brand-600">Open full profile</Link></td>
                        <td className="td">{s.designation || "—"}</td>
                        <td className="td">{s.phone || "—"}</td>
                        <td className="td">{s.email}</td>
                        <td className="td text-right">{formatMoney(s.salary)}</td>
                        <td className="td whitespace-nowrap text-right">
                          <Link href={`/staff/${s.id}/edit`} className="mr-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Edit</Link>
                          <button onClick={() => setDeleting(s)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </main>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} confirmText="Deactivate"
        title="Remove staff account?" message={deleting ? `${deleting.name} will be signed out and can no longer log in. Sales and expenses they submitted stay in the records.` : ""} />
    </>
  );
}
