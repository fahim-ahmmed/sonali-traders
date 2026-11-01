"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Users } from "lucide-react";
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

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/staff");
      const result = await response.json();
      if (!response.ok || !result.ok) return toast(result.error || "Could not load staff", "error");
      setItems(result.data);
    } catch {
      toast("Could not load staff. Please try again.", "error");
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(`/api/staff/${deleting.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.ok) return toast(result.error || "Could not delete staff profile", "error");
      setDeleting(null);
      toast("Staff profile deleted");
      load();
    } catch {
      toast("Could not delete staff profile. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader group="Staff / Staff List" title="Team management" />
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="page-title">Staff List</h2><p className="page-subtitle">Manage staff profiles, accounts and salaries.</p></div>
          <Link href="/staff/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]"><Plus className="h-4 w-4" /> Add New Staff</Link>
        </div>
        <div className="card overflow-hidden">
          {!items ? <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : !items.length ? <EmptyState icon={Users} title="No staff yet" hint="Create accounts for your sales team." actionHref="/staff/create" actionLabel="Add New Staff" />
            : (
              <div className="table-wrap max-h-[70vh]">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-sky-50 via-slate-50 to-amber-50">
                      <th className="sticky top-0 z-[1] border-b border-slate-200 bg-sky-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-brand-700">Staff Name</th>
                      <th className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-brand-700">Designation</th>
                      <th className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-brand-700">Phone</th>
                      <th className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-brand-700">Email</th>
                      <th className="sticky top-0 z-[1] border-b border-slate-200 bg-amber-50 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-brand-700">Salary</th>
                      <th className="sticky top-0 z-[1] border-b border-slate-200 bg-amber-50 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-brand-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="rows">
                    {items.map((s) => (
                      <tr key={s.id}>
                        <td className="td">
                          <Link href={`/staff/${s.id}`} className="group inline-flex flex-col">
                            <span className="font-semibold text-brand-700 group-hover:text-brand-900">{s.name}</span>
                            <span className="mt-0.5 text-[11px] text-slate-500">Open full profile</span>
                          </Link>
                        </td>
                        <td className="td whitespace-nowrap font-semibold text-amber-700">{s.designation || "—"}</td>
                        <td className="td num font-semibold text-emerald-700">{s.phone || "—"}</td>
                        <td className="td whitespace-nowrap font-semibold text-violet-700">{s.email}</td>
                        <td className="td num text-right font-bold text-orange-700">{formatMoney(s.salary)}</td>
                        <td className="td whitespace-nowrap text-center">
                          <div className="inline-flex gap-1.5">
                            <Link href={`/staff/${s.id}/edit`} className="inline-flex min-h-8 items-center rounded-md bg-sky-100 px-2.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-sky-200">Edit</Link>
                            <button onClick={() => setDeleting(s)} className="inline-flex min-h-8 items-center rounded-md bg-rose-100 px-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-200">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </main>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} confirmText="Delete"
        title="Delete staff profile?" message={deleting ? `${deleting.name}'s profile will be deactivated. The profile and related records will remain in the database.` : ""} />
    </>
  );
}
