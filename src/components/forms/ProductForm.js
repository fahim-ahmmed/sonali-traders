"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { toPaisa, toTaka } from "@/lib/money";

// create ও edit দুই কাজেই; edit-এ productId দিন
export default function ProductForm({ productId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [cats, setCats] = useState(null);
  const [loaded, setLoaded] = useState(!productId);
  const [f, setF] = useState({ name: "", category: "", categoryId: "", buy: "", sell: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((j) => j.ok ? setCats(j.data) : toast(j.error, "error"));
  }, [toast]);

  useEffect(() => {
    if (!productId || !cats) return;
    fetch(`/api/products/${productId}`).then((r) => r.json()).then((j) => {
      if (!j.ok) { toast(j.error, "error"); return router.replace("/products"); }
      const p = j.data;
      setF({ name: p.name, category: p.category, categoryId: p.categoryId, buy: p.buyPrice ? String(toTaka(p.buyPrice)) : "", sell: String(toTaka(p.sellPrice)) });
      setLoaded(true);
    });
  }, [productId, cats, router, toast]);

  const categoryNames = useMemo(() => [...new Set((cats || []).map((c) => c.category))], [cats]);
  const brands = useMemo(() => (cats || []).filter((c) => c.category === f.category), [cats, f.category]);
  const warn = f.buy !== "" && f.sell !== "" && Number(f.sell) < Number(f.buy);

  function validate() {
    const e = {};
    if (!f.name.trim()) e.name = "Product name is required";
    if (!f.category) e.category = "Select a category";
    if (!f.categoryId) e.categoryId = "Select a brand";
    if (f.sell === "" || isNaN(Number(f.sell)) || Number(f.sell) < 0) e.sell = "Enter a selling price (0 or more)";
    if (f.buy !== "" && (isNaN(Number(f.buy)) || Number(f.buy) < 0)) e.buy = "Buying price must be 0 or more";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    const res = await fetch(productId ? `/api/products/${productId}` : "/api/products", {
      method: productId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.name, categoryId: f.categoryId, buyPrice: f.buy === "" ? null : toPaisa(f.buy), sellPrice: toPaisa(f.sell) }),
    }).then((r) => r.json());
    if (!res.ok) { toast(res.error, "error"); setSaving(false); return; }
    toast(productId ? "Product updated" : "Product saved");
    router.push("/products");
    router.refresh();
  }

  if (!cats || !loaded) return <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>;

  if (!cats.length) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
        No categories yet. <Link href="/products/categories/create" className="font-semibold underline">Add a category and brand</Link> first.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Product name" name="name" placeholder="e.g. 16mm Rod" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Select category" name="category" value={f.category} error={errors.category}
          onChange={(e) => setF({ ...f, category: e.target.value, categoryId: "" })}>
          <option value="">Choose category</option>
          {categoryNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
        <Select label="Select brand" name="categoryId" value={f.categoryId} error={errors.categoryId} disabled={!f.category}
          onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
          <option value="">{f.category ? "Choose brand" : "Choose a category first"}</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.brand}</option>)}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Buying price (optional)" name="buy" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={f.buy} onChange={(e) => setF({ ...f, buy: e.target.value })} error={errors.buy} />
        <Input label="Selling price" name="sell" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" value={f.sell} onChange={(e) => setF({ ...f, sell: e.target.value })} error={errors.sell} />
      </div>
      {warn && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
          <AlertTriangle className="h-4 w-4" /> Selling price is lower than buying price. You can still save.
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Link href="/products" className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cancel</Link>
        <Button type="submit" loading={saving}>{productId ? "Update product" : "Save product"}</Button>
      </div>
    </form>
  );
}
