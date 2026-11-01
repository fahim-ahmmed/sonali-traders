"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, ShoppingBasket, Trash2 } from "lucide-react";
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
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-title">Purchase List</h2>
            <p className="page-subtitle">View and manage every supplier purchase and its products.</p>
          </div>
          <Link href="/purchases/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]"><Plus className="h-4 w-4" /> New Purchase</Link>
        </div>
        <div className="card overflow-hidden">
          {!data ? <div className="space-y-2 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : !data.items.length ? <EmptyState icon={ShoppingBasket} title="No purchases added yet" hint="Record a supplier purchase to add stock and track supplier dues." actionHref="/purchases/create" actionLabel="New Purchase" />
            : (
              <div className="table-wrap max-h-[70vh]">
                <table className="w-full min-w-[820px]">
                  <thead><tr><th className="th">Date</th><th className="th">Supplier</th><th className="th">Company</th><th className="th text-right">Total Amount</th><th className="th text-right">Supplier Due</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="rows">
                    {data.items.map((p) => {
                      const dueAmt = p.grandTotal - p.paidAmount;
                      return (
                        <tr key={p.id}>
                          <td className="td num text-slate-500">{formatDate(p.date)}</td>
                          <td className="td">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-navy-900">{p.supplier}</span>
                              {!p.stockControl && <span className="badge badge-neutral">Record only</span>}
                            </div>
                          </td>
                          <td className="td text-slate-600">{p.company || "—"}</td>
                          <td className="td num text-right font-semibold text-navy-900">{formatMoney(p.grandTotal)}</td>
                          <td className="td text-right">{dueAmt > 0 ? <span className="badge badge-danger num">{formatMoney(dueAmt)}</span> : <span className="badge badge-success">Paid</span>}</td>
                          <td className="td whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button onClick={() => setViewing(p)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"><Eye className="h-3.5 w-3.5" aria-hidden /> View</button>
                              <Link href={`/purchases/${p.id}/edit`} aria-label="Edit purchase" title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"><Pencil className="h-3.5 w-3.5" /></Link>
                              <button onClick={() => setDeleting(p)} aria-label="Delete purchase" title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
        </div>
      </main>

      <Modal size="lg" open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.supplier} — ${formatDate(viewing.date)}` : ""}>
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead><tr><th className="th">Product</th><th className="th text-right">Qty</th><th className="th text-right">Price</th><th className="th text-right">Total</th></tr></thead>
                <tbody className="rows">
                  {viewing.items.map((i, k) => <tr key={k}><td className="td text-navy-900">{i.name}</td><td className="td num text-right">{i.qty}</td><td className="td num text-right">{formatMoney(i.buyPrice)}</td><td className="td num text-right font-medium">{formatMoney(i.lineTotal)}</td></tr>)}
                </tbody>
              </table>
            </div>
            <dl className="space-y-1.5 rounded-xl bg-slate-50 p-4">
              <div className="flex justify-between font-semibold text-navy-900"><dt>Grand total</dt><dd className="num">{formatMoney(viewing.grandTotal)}</dd></div>
              <div className="flex justify-between text-slate-600"><dt>Paid</dt><dd className="num text-emerald-600">{formatMoney(viewing.paidAmount)}</dd></div>
              <div className="flex justify-between text-slate-600"><dt>Supplier due</dt><dd className="num text-rose-600">{formatMoney(viewing.grandTotal - viewing.paidAmount)}</dd></div>
            </dl>
            <p className="text-xs text-slate-500">{viewing.stockControl ? "Stock was added." : "Record only — stock not changed."}</p>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy}
        title="Delete purchase?" message="The stock added by this purchase will be taken back out. This can't be undone." />
    </>
  );
}
