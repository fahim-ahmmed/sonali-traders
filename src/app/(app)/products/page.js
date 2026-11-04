"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, ChevronDown, Hammer, History, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/money";

const unitLabel = (cat) => (String(cat || "").toUpperCase() === "ROD" ? "KG" : "Bag");

export default function ProductListPage() {
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [allCategories, setAllCategories] = useState([]);
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
        if (result.ok) setAllCategories(result.data);
        else toast(result.error, "error");
      })
      .catch(() => toast("Unable to load categories", "error"));
  }, [toast]);

  // ক্যাটাগরি অনুযায়ী সাব-ক্যাটাগরি (ব্র্যান্ড) গ্রুপিং
  const groupedCategories = useMemo(() => {
    const map = new Map();
    for (const item of allCategories) {
      const catName = String(item.category || "").toUpperCase();
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName).push(item);
    }
    return [...map.entries()];
  }, [allCategories]);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "25", active: "1" });
    if (debounced) params.set("q", debounced);
    if (categoryId) params.set("categoryId", categoryId);
    else if (category) params.set("category", category);
    fetch(`/api/products?${params}`)
      .then((response) => response.json())
      .then((result) => result.ok ? setData(result.data) : toast(result.error, "error"))
      .catch(() => toast("Unable to load products", "error"));
  }, [page, debounced, category, categoryId, toast]);
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

  const productDetails = (product) => {
    const isRod = String(product.category).toUpperCase() === "ROD";
    return (
      <div className="flex items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isRod ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600"}`}>
          {isRod ? <Hammer className="h-4 w-4" aria-hidden /> : <Boxes className="h-4 w-4" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-900">{product.name}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Unit: Per {unitLabel(product.category)}</p>
        </div>
      </div>
    );
  };

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

        <section className="card overflow-visible">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="card-title">All Products</h3>
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search product name" aria-label="Search product name" className="field pl-10" />
              </div>

              {/* Category ও Sub-Category Hover Menu */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setCategory(""); setCategoryId(""); setSelectedBrand(""); setPage(1); }}
                  className={`pill ${!category && !categoryId ? "pill-active" : ""}`}
                >
                  All
                </button>

                {groupedCategories.map(([catName, subItems]) => {
                  const isActive = category === catName;
                  return (
                    <div key={catName} className="group relative">
                      <button
                        type="button"
                        onClick={() => {
                          setCategory(catName);
                          setCategoryId("");
                          setSelectedBrand("");
                          setPage(1);
                        }}
                        className={`pill ${isActive ? "pill-active" : ""}`}
                      >
                        <span>{catName}</span>
                        {isActive && selectedBrand && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                            {selectedBrand}
                          </span>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180" aria-hidden />
                      </button>

                      {/* Hover Sub-category Dropdown */}
                      <div className="invisible absolute left-0 top-full z-30 w-56 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                        <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                          <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {catName} Sub-Categories
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(catName);
                              setCategoryId("");
                              setSelectedBrand("");
                              setPage(1);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${isActive && !categoryId ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
                          >
                            <span>All {catName}</span>
                          </button>
                          {subItems.map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setCategory(catName);
                                setCategoryId(sub.id);
                                setSelectedBrand(sub.brand);
                                setPage(1);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${categoryId === sub.id ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
                            >
                              <span>{sub.brand}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {data && <span className="badge badge-neutral num">{data.total} total</span>}
          </div>

          {!data ? <div className="space-y-2 p-5">{[...Array(5)].map((_, index) => <Skeleton key={index} className="h-12" />)}</div>
            : !data.items.length ? (
              <EmptyState icon={Package} title={debounced || category || categoryId ? "No products match" : "No products yet"} hint={debounced || category || categoryId ? "Try a different search or filter." : "Add your first product to start selling."}
                actionHref={debounced || category || categoryId ? undefined : "/products/create"} actionLabel="Add Product" />
            ) : (
              <>
                <div className="hidden max-h-[70vh] overflow-auto md:block">
                  <table className="w-full min-w-[760px]">
                    <thead><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Sub-Category / Brand</th><th className="th text-right">Selling Price</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody className="rows">
                      {data.items.map((product) => (
                        <tr key={product.id}>
                          <td className="td">{productDetails(product)}</td>
                          <td className="td"><span className="badge badge-neutral">{product.category}</span><p className="mt-1 text-[11px] text-slate-400">Category</p></td>
                          <td className="td text-slate-700">{product.brand}<p className="mt-1 text-[11px] text-slate-400">Sub-category</p></td>
                          <td className="td num text-right font-semibold text-navy-900">
                            {formatMoney(product.sellPrice)} <span className="text-xs font-normal text-slate-500">/ {unitLabel(product.category)}</span>
                            <p className="mt-1 text-[11px] font-normal text-slate-400">Selling price</p>
                          </td>
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
                        <div><p className="text-xs text-slate-400">Sub-Category</p><p className="mt-1 font-medium text-slate-700">{product.brand}</p></div>
                        <div><p className="text-xs text-slate-400">Selling price</p><p className="num mt-1 font-semibold text-navy-900">{formatMoney(product.sellPrice)} / {unitLabel(product.category)}</p></div>
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