"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey } from "@/lib/dates";
import { formatMoney, toPaisa, toTaka } from "@/lib/money";

const blank = () => ({ productId: "", qty: "", price: "" });

export default function PurchaseForm({ purchaseId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState(null);
  const [products, setProducts] = useState(null);
  const [loaded, setLoaded] = useState(!purchaseId);
  const [f, setF] = useState({ supplierId: "", date: dhakaDateKey(), stockControl: "yes", paid: "" });
  const [lines, setLines] = useState([blank()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/suppliers?limit=200").then((r) => r.json()).then((j) => j.ok ? setSuppliers(j.data.items) : toast(j.error, "error"));
    fetch("/api/products?limit=100").then((r) => r.json()).then((j) => j.ok ? setProducts(j.data.items) : toast(j.error, "error"));
  }, [toast]);

  useEffect(() => {
    if (!purchaseId) return;
    fetch(`/api/purchases/${purchaseId}`).then((r) => r.json()).then((j) => {
      if (!j.ok) { toast(j.error, "error"); return router.replace("/purchases"); }
      const p = j.data;
      setF({ supplierId: p.supplierId, date: p.dateKey, stockControl: p.stockControl ? "yes" : "no", paid: p.paidAmount === p.grandTotal ? "" : String(toTaka(p.paidAmount)) });
      setLines(p.items.map((i) => ({ productId: i.productId, qty: String(i.qty), price: String(toTaka(i.buyPrice)) })));
      setLoaded(true);
    });
  }, [purchaseId, router, toast]);

  const pmap = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);
  const lineTotal = (l) => Math.round((Number(l.qty) || 0) * toPaisa(l.price));
  const grand = lines.reduce((s, l) => s + lineTotal(l), 0);

  const setLine = (i, patch) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  function pickProduct(i, id) {
    const p = pmap.get(id);
    // দাম ফাঁকা থাকলে শেষ ক্রয়দর বসে
    setLine(i, { productId: id, price: lines[i].price || (p?.buyPrice ? String(toTaka(p.buyPrice)) : "") });
  }

  function validate() {
    const e = {};
    if (!f.supplierId) e.supplierId = "Select a supplier";
    if (!f.date) e.date = "Choose a purchase date";
    const le = lines.map((l) => {
      if (!l.productId) return "Select a product";
      if (!(Number(l.qty) > 0)) return "Quantity must be more than 0";
      if (l.price === "" || Number(l.price) < 0) return "Enter a buying price";
      return "";
    });
    if (le.some(Boolean)) e.lines = le;
    if (f.paid !== "" && (Number(f.paid) < 0 || toPaisa(f.paid) > grand)) e.paid = "Paid amount can't be more than the grand total";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    const body = {
      supplierId: f.supplierId, date: f.date, stockControl: f.stockControl === "yes",
      items: lines.map((l) => ({ productId: l.productId, qty: Number(l.qty), buyPrice: toPaisa(l.price) })),
      paidAmount: f.paid === "" ? null : toPaisa(f.paid),
    };
    const res = await fetch(purchaseId ? `/api/purchases/${purchaseId}` : "/api/purchases", {
      method: purchaseId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }).then((r) => r.json());
    if (!res.ok) { toast(res.error, "error"); setSaving(false); return; }
    toast(purchaseId ? "Purchase updated" : "Purchase saved");
    router.push("/purchases"); router.refresh();
  }

  if (!suppliers || !products || !loaded) return <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-32" /></div>;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Select label="Supplier" name="supplierId" value={f.supplierId} error={errors.supplierId} onChange={(e) => setF({ ...f, supplierId: e.target.value })}>
            <option value="">{suppliers.length ? "Select supplier" : "No supplier yet"}</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.company ? ` — ${s.company}` : ""}</option>)}
          </Select>
          {!suppliers.length && <Link href="/suppliers/create" className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:underline">No supplier — Add supplier</Link>}
        </div>
        <Input label="Purchase date" name="date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} error={errors.date} />
      </div>
      <Select label="Stock control" name="stockControl" value={f.stockControl} onChange={(e) => setF({ ...f, stockControl: e.target.value })} className="sm:max-w-md">
        <option value="yes">Yes - Add to stock and deduct in POS</option>
        <option value="no">No - Record only, don't change stock</option>
      </Select>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900">Purchase products</h3>
          <button type="button" onClick={() => setLines([...lines, blank()])} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"><Plus className="h-3.5 w-3.5" /> Add Product</button>
        </div>
        <div className="space-y-3">
          {lines.map((l, i) => {
            const p = pmap.get(l.productId);
            const err = errors.lines?.[i];
            return (
              <div key={i} className={`rounded-lg border p-3 ${err ? "border-danger" : "border-slate-200"}`}>
                <div className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <Select label="Product" value={l.productId} onChange={(e) => pickProduct(i, e.target.value)}>
                    <option value="">Select product</option>
                    {products.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.brand})</option>)}
                  </Select>
                  <Input label="Quantity" type="number" min="0" step="any" inputMode="decimal" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                  <Input label="Buying price" type="number" min="0" step="0.01" inputMode="decimal" value={l.price} onChange={(e) => setLine(i, { price: e.target.value })} />
                  <div><span className="field-label">Line total</span><div className="field flex items-center bg-slate-50 font-semibold">{formatMoney(lineTotal(l))}</div></div>
                  <button type="button" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, k) => k !== i))} aria-label="Remove line" className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-danger hover:bg-red-100 disabled:opacity-40"><X className="h-4 w-4" /></button>
                </div>
                {p && <p className="mt-2 text-xs text-slate-500">Current stock: {p.stock}{p.buyPrice ? ` · Last buying price: ${formatMoney(p.buyPrice)}` : ""}</p>}
                {err && <p className="field-error">{err}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
        <Input label="Paid amount (optional)" name="paid" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Leave empty if fully paid" value={f.paid}
          onChange={(e) => setF({ ...f, paid: e.target.value })} error={errors.paid} hint="Anything unpaid counts as Supplier Due." className="w-full sm:max-w-xs" />
        <p className="text-sm text-slate-500">Grand total <span className="ml-2 text-2xl font-bold text-navy-900">{formatMoney(grand)}</span></p>
      </div>
      <div className="flex justify-end gap-2">
        <Link href="/purchases" className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cancel</Link>
        <Button type="submit" loading={saving}>{purchaseId ? "Update purchase" : "Save purchase"}</Button>
      </div>
    </form>
  );
}
