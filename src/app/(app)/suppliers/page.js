"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
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
      <main className="p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Supplier List</h2>
            <p className="text-sm text-slate-500">Manage supplier contacts and company information.</p>
          </div>
          <Link href="/suppliers/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Add Supplier</Link>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <div className="relative sm:max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, phone" aria-label="Search suppliers" className="field pl-9" />
            </div>
          </div>
          {!data ? <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : !data.items.length ? (
              <EmptyState title={dq ? "No suppliers match" : "No suppliers added yet"} hint={dq ? "Try a different search." : "Add your first supplier to record purchases."}
                actionHref={dq ? undefined : "/suppliers/create"} actionLabel="Add your first supplier" />
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[680px]">
                  <thead><tr><th className="th">Supplier name</th><th className="th">Company name</th><th className="th">Address</th><th className="th">Phone number</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="td font-semibold text-navy-900">{s.name}</td>
                        <td className="td">{s.company || "—"}</td>
                        <td className="td">{s.address || "—"}</td>
                        <td className="td">{s.phone || "—"}</td>
                        <td className="td whitespace-nowrap text-right">
                          <Link href={`/suppliers/${s.id}/edit`} className="mr-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Edit</Link>
                          <button onClick={() => setDeleting(s)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100">Delete</button>
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
