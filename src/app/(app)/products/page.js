"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
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
      <main className="p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Product List</h2>
            <p className="text-sm text-slate-500">View, edit and manage all products in your inventory.</p>
          </div>
          <Link href="/products/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Add Product</Link>
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product name" aria-label="Search product name" className="field pl-9" />
            </div>
            <div className="flex gap-2">
              {CHIPS.map(([v, label]) => (
                <button key={v} onClick={() => { setCategory(v); setPage(1); }}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${category === v ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
              ))}
            </div>
          </div>

          {!data ? <div className="space-y-2 p-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            : !data.items.length ? (
              <EmptyState title={debounced || category ? "No products match" : "No products yet"} hint={debounced || category ? "Try a different search or filter." : "Add your first product to start selling."}
                actionHref={debounced || category ? undefined : "/products/create"} actionLabel="Add product" />
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[640px]">
                  <thead><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Brand</th><th className="th text-right">Selling price</th><th className="th text-right">Stock</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="td font-semibold text-navy-900">{p.name}</td>
                        <td className="td">{p.category}</td>
                        <td className="td">{p.brand}</td>
                        <td className="td text-right font-semibold">{formatMoney(p.sellPrice)}</td>
                        <td className={`td text-right ${p.stock < 0 ? "font-semibold text-danger" : ""}`}>{p.stock}</td>
                        <td className="td whitespace-nowrap text-right">
                          <Link href={`/products/${p.id}/edit`} className="mr-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Edit</Link>
                          <button onClick={() => setDeleting(p)} className="mr-2 rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100">Delete</button>
                          <Link href={`/products/${p.id}/ledger`} className="text-xs font-semibold text-brand-600 hover:underline">View Ledger</Link>
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
