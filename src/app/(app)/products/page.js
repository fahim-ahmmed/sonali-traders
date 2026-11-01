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

export default function ProductListPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(q); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => response.json())
      .then((result) => {
        if (result.ok) setCategories([...new Set(result.data.map((item) => item.category))].sort());
        else toast(result.error, "error");
      })
      .catch(() => toast("Unable to load categories", "error"));
  }, [toast]);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "25", active: "1" });
    if (debounced) params.set("q", debounced);
    if (category) params.set("category", category);
    fetch(`/api/products?${params}`)
      .then((response) => response.json())
      .then((result) => result.ok ? setData(result.data) : toast(result.error, "error"))
      .catch(() => toast("Unable to load products", "error"));
  }, [page, debounced, category, toast]);
  useEffect(load, [load]);

  async function remove() {
    setBusy(true);
    const response = await fetch(`/api/products/${deleting.id}`, { method: "DELETE" })
      .then((result) => result.json())
      .catch(() => ({ ok: false, error: "Unable to archive product" }));
    setBusy(false);
    setDeleting(null);
    if (!response.ok) return toast(response.error, "error");
    toast("Product archived");
    load();
  }

  const productDetails = (product) => (
    <>
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${String(product.category).toUpperCase() === "ROD" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600"}`}>
          {String(product.category).toUpperCase() === "ROD" ? <Hammer className="h-4 w-4" aria-hidden /> : <Boxes className="h-4 w-4" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{product.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Product name</p>
        </div>
      </div>
    </>
  );

  const actions = (product) => (
    <div className="flex items-center gap-1.5">
      <Link href={`/products/${product.id}/ledger`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50">
        <History className="h-3.5 w-3.5" aria-hidden /> View Ledger
      </Link>
      <Link href={`/products/${product.id}/edit`} aria-label={`Edit ${product.name}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700">
        <Pencil className="h-3.5 w-3.5" aria-hidden />
      </Link>
      <button onClick={() => setDeleting(product)} aria-label={`Delete ${product.name}`} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );

  return (
    <>
      <PageHeader group="Product / Product List" title="Product management" />
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-title">Product List</h2>
            <p className="page-subtitle">View, edit and manage all products in your inventory.</p>
          </div>
          <Link href="/products/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]">
            <Plus className="h-4 w-4" aria-hidden /> Add Product
          </Link>
        </div>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="card-title">All Products</h3>
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search product name" aria-label="Search product name" className="field pl-10" />
              </div>
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {[["", "All"], ...categories.map((name) => [name, name])].map(([value, label]) => (
                    <button key={value || "all"} type="button" onClick={() => { setCategory(value); setPage(1); }}
                      className={`pill whitespace-nowrap ${category === value ? "pill-active" : ""}`}>{label}</button>
                  ))}
                </div>
              )}
            </div>
            {data && <span className="badge badge-neutral num">{data.total} total</span>}
          </div>

          {!data ? <div className="space-y-2 p-5">{[...Array(5)].map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
            : !data.items.length ? (
              <EmptyState icon={Package} title={debounced || category ? "No products match" : "No products yet"} hint={debounced || category ? "Try a different search or filter." : "Add your first product to start selling."}
                actionHref={debounced || category ? undefined : "/products/create"} actionLabel="Add Product" />
            ) : (
              <>
                <div className="hidden max-h-[70vh] overflow-auto md:block">
                  <table className="w-full min-w-[760px]">
                    <thead><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Brand</th><th className="th text-right">Selling Price</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody className="rows">
                      {data.items.map((product) => (
                        <tr key={product.id}>
                          <td className="td">{productDetails(product)}</td>
                          <td className="td"><span className="badge badge-neutral">{product.category}</span><p className="mt-1 text-[11px] text-slate-400">Category</p></td>
                          <td className="td text-slate-700">{product.brand}<p className="mt-1 text-[11px] text-slate-400">Brand</p></td>
                          <td className="td num text-right font-semibold text-navy-900">{formatMoney(product.sellPrice)}<p className="mt-1 text-[11px] font-normal text-slate-400">Selling price</p></td>
                          <td className="td"><div className="justify-end">{actions(product)}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-slate-100 md:hidden">
                  {data.items.map((product) => (
                    <article key={product.id} className="space-y-4 p-4">
                      {productDetails(product)}
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><p className="text-xs text-slate-400">Category</p><p className="mt-1"><span className="badge badge-neutral">{product.category}</span></p></div>
                        <div><p className="text-xs text-slate-400">Brand</p><p className="mt-1 font-medium text-slate-700">{product.brand}</p></div>
                        <div><p className="text-xs text-slate-400">Selling price</p><p className="num mt-1 font-semibold text-navy-900">{formatMoney(product.sellPrice)}</p></div>
                      </div>
                      <div className="flex justify-end border-t border-slate-100 pt-2">{actions(product)}</div>
                    </article>
                  ))}
                </div>
              </>
            )}
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
        </section>
      </main>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy}
        title="Archive product?" message={deleting ? `${deleting.name} will be archived. Its historical transactions will remain unchanged.` : ""} />
    </>
  );
}
