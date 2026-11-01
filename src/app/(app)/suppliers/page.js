"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

export default function SupplierListPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const load = useCallback(() => {
    const p = new URLSearchParams({ page, limit: 25 });
    if (dq) p.set("q", dq);
    fetch(`/api/suppliers?${p}`).then((r) => r.json()).then((j) => j.ok ? setData(j.data) : toast(j.error, "error"));
  }, [page, dq, toast]);
  useEffect(load, [load]);

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/suppliers/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false); setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast("Supplier deleted"); load();
  }

  return (
    <>
      <PageHeader group="Supplier / Supplier List" title="Supplier management" />
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-title">Supplier List</h2>
            <p className="page-subtitle">Manage supplier contacts and company information.</p>
          </div>
          <Link href="/suppliers/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]"><Plus className="h-4 w-4" /> Add Supplier</Link>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="relative sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, phone" aria-label="Search suppliers" className="field pl-10" />
            </div>
          </div>
          {!data ? <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : !data.items.length ? (
              <EmptyState icon={Truck} title={dq ? "No suppliers match" : "No suppliers added yet"} hint={dq ? "Try a different search." : "Add your first supplier to record purchases."}
                actionHref={dq ? undefined : "/suppliers/create"} actionLabel="Add Supplier" />
            ) : (
              <div className="table-wrap max-h-[70vh]">
                <table className="w-full min-w-[720px]">
                  <thead><tr><th className="th">Supplier Name</th><th className="th">Company Name</th><th className="th">Address</th><th className="th">Phone Number</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="rows">
                    {data.items.map((s) => (
                      <tr key={s.id}>
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-500/10 text-gold-600"><Truck className="h-4 w-4" aria-hidden /></span>
                            <span className="font-semibold text-navy-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="td text-slate-600">{s.company || "—"}</td>
                        <td className="td max-w-[240px] truncate text-slate-500">{s.address || "—"}</td>
                        <td className="td num">{s.phone || "—"}</td>
                        <td className="td whitespace-nowrap text-right">
                          <div className="inline-flex gap-1.5">
                            <Link href={`/suppliers/${s.id}/edit`} aria-label={`Edit ${s.name}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"><Pencil className="h-3.5 w-3.5" /></Link>
                            <button onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
        </div>
      </main>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy}
        title="Delete supplier?" message={deleting ? `${deleting.name} will be removed. Suppliers with purchases can't be deleted.` : ""} />
    </>
  );
}
