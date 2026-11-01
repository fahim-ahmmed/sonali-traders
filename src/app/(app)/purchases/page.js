"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export default function PurchaseListPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/purchases?page=${page}&limit=25`).then((r) => r.json()).then((j) => j.ok ? setData(j.data) : toast(j.error, "error"));
  }, [page, toast]);
  useEffect(load, [load]);

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/purchases/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false); setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast("Purchase deleted and stock restored"); load();
  }

  return (
    <>
      <PageHeader group="Purchase / Purchase List" title="Purchase management" />
      <main className="p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Purchase List</h2>
            <p className="text-sm text-slate-500">View and manage every supplier purchase and its products.</p>
          </div>
          <Link href="/purchases/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> New Purchase</Link>
        </div>
        <div className="card overflow-hidden">
          {!data ? <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : !data.items.length ? <EmptyState title="No purchases added yet" hint="Record a supplier purchase to add stock." actionHref="/purchases/create" actionLabel="New purchase" />
            : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[640px]">
                  <thead><tr><th className="th">Date</th><th className="th">Supplier</th><th className="th">Company</th><th className="th text-right">Total amount</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="td">{formatDate(p.date)}</td>
                        <td className="td font-semibold text-navy-900">{p.supplier}</td>
                        <td className="td">{p.company || "—"}</td>
                        <td className="td text-right font-semibold">{formatMoney(p.grandTotal)}</td>
                        <td className="td whitespace-nowrap text-right">
                          <button onClick={() => setViewing(p)} className="mr-2 text-xs font-semibold text-brand-600 hover:underline">View</button>
                          <Link href={`/purchases/${p.id}/edit`} className="mr-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Edit</Link>
                          <button onClick={() => setDeleting(p)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100">Delete</button>
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

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.supplier} — ${formatDate(viewing.date)}` : ""}>
        {viewing && (
          <div className="text-sm">
            <table className="w-full">
              <thead><tr><th className="th">Product</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {viewing.items.map((i, k) => <tr key={k}><td className="td">{i.name}</td><td className="td text-right">{i.qty}</td><td className="td text-right">{formatMoney(i.buyPrice)}</td><td className="td text-right">{formatMoney(i.lineTotal)}</td></tr>)}
              </tbody>
            </table>
            <p className="mt-3 flex justify-between font-bold text-navy-900"><span>Grand total</span><span>{formatMoney(viewing.grandTotal)}</span></p>
            <p className="flex justify-between text-slate-600"><span>Paid</span><span>{formatMoney(viewing.paidAmount)}</span></p>
            <p className="flex justify-between text-slate-600"><span>Supplier due</span><span>{formatMoney(viewing.grandTotal - viewing.paidAmount)}</span></p>
            <p className="mt-2 text-xs text-slate-500">{viewing.stockControl ? "Stock was added." : "Record only — stock not changed."}</p>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy}
        title="Delete purchase?" message="The stock added by this purchase will be taken back out. This can't be undone." />
    </>
  );
}
