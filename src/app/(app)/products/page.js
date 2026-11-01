"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, Hammer, History, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/money";

const CHIPS = [["", "All"], ["cement", "Cement"], ["rod", "Rod"]];

export default function ProductListPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const load = useCallback(() => {
    const p = new URLSearchParams({ page, limit: 25 });
    if (debounced) p.set("q", debounced);
    if (category) p.set("category", category);
    fetch(`/api/products?${p}`).then((r) => r.json()).then((j) => j.ok ? setData(j.data) : toast(j.error, "error"));
  }, [page, debounced, category, toast]);
  useEffect(load, [load]);

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/products/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false); setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast(res.data.archived ? "Product archived (it has stock history)" : "Product deleted");
    load();
  }

  return (
    <>
      <PageHeader group="Product / Product List" title="Product management" />
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-title">Product List</h2>
            <p className="page-subtitle">View, edit and manage all products in your inventory.</p>
          </div>
          <Link href="/products/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]"><Plus className="h-4 w-4" /> Add Product</Link>
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product name" aria-label="Search product name" className="field pl-10" />
            </div>
            <div className="flex gap-2">
              {CHIPS.map(([v, label]) => (
                <button key={v} onClick={() => { setCategory(v); setPage(1); }}
                  className={`pill ${category === v ? "pill-active" : ""}`}>{label}</button>
              ))}
            </div>
          </div>

          {!data ? <div className="space-y-2 p-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : !data.items.length ? (
              <EmptyState icon={Package} title={debounced || category ? "No products match" : "No products yet"} hint={debounced || category ? "Try a different search or filter." : "Add your first product to start selling."}
                actionHref={debounced || category ? undefined : "/products/create"} actionLabel="Add Product" />
            ) : (
              <div className="table-wrap max-h-[70vh]">
                <table className="w-full min-w-[760px]">
                  <thead><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Brand</th><th className="th text-right">Selling Price</th><th className="th text-right">Stock</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="rows">
                    {data.items.map((p) => (
                      <tr key={p.id}>
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${String(p.category).toUpperCase() === "ROD" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600"}`}>
                              {String(p.category).toUpperCase() === "ROD" ? <Hammer className="h-4 w-4" aria-hidden /> : <Boxes className="h-4 w-4" aria-hidden />}
                            </span>
                            <span className="font-semibold text-navy-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="td"><span className="badge badge-neutral">{p.category}</span></td>
                        <td className="td text-slate-600">{p.brand}</td>
                        <td className="td num text-right font-semibold text-navy-900">{formatMoney(p.sellPrice)}</td>
                        <td className="td text-right">
                          <span className={`badge num ${p.stock < 0 ? "badge-danger" : p.stock === 0 ? "badge-warning" : "badge-success"}`}>{p.stock}</span>
                        </td>
                        <td className="td whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link href={`/products/${p.id}/ledger`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50">
                              <History className="h-3.5 w-3.5" aria-hidden /> View Ledger
                            </Link>
                            <Link href={`/products/${p.id}/edit`} aria-label={`Edit ${p.name}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700">
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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
        title="Delete product?" message={deleting ? `${deleting.name} will be removed. If it already has stock history it will be archived instead, so old records stay correct.` : ""} />
    </>
  );
}
