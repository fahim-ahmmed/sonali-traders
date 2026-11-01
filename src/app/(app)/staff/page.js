"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, UserX, Users } from "lucide-react";
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
                  <thead><tr><th className="th">Staff Name</th><th className="th">Designation</th><th className="th">Phone</th><th className="th">Email</th><th className="th text-right">Salary</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="rows">
                    {items.map((s) => (
                      <tr key={s.id}>
                        <td className="td">
                          <Link href={`/staff/${s.id}`} className="group flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">{(s.name || "?").slice(0, 2).toUpperCase()}</span>
                            <span>
                              <span className="block font-semibold text-navy-900 group-hover:text-brand-600">{s.name}</span>
                              <span className="block text-[11px] text-slate-400">Open full profile →</span>
                            </span>
                          </Link>
                        </td>
                        <td className="td">{s.designation ? <span className="badge badge-neutral">{s.designation}</span> : "—"}</td>
                        <td className="td num">{s.phone || "—"}</td>
                        <td className="td text-slate-600">{s.email}</td>
                        <td className="td num text-right font-medium text-navy-900">{formatMoney(s.salary)}</td>
                        <td className="td whitespace-nowrap text-right">
                          <div className="inline-flex gap-1.5">
                            <Link href={`/staff/${s.id}/edit`} aria-label={`Edit ${s.name}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"><Pencil className="h-3.5 w-3.5" /></Link>
                            <button onClick={() => setDeleting(s)} aria-label={`Deactivate ${s.name}`} title="Deactivate" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><UserX className="h-3.5 w-3.5" /></button>
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
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} confirmText="Deactivate"
        title="Remove staff account?" message={deleting ? `${deleting.name} will be signed out and can no longer log in. Sales and expenses they submitted stay in the records.` : ""} />
    </>
  );
}
