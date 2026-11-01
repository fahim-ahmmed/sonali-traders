"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Plus, UserPlus, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import Combobox from "@/components/ui/Combobox";
import Modal from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import CustomerPicker from "@/components/forms/CustomerPicker";
import { dhakaDateKey } from "@/lib/dates";
import { formatMoney, toPaisa, toTaka } from "@/lib/money";

const newRef = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
let seq = 0;
const blank = () => ({ key: ++seq, productId: "", qty: "", rate: "" });

export default function PosScreen({ isAdmin }) {
  const { toast } = useToast();
  const [products, setProducts] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [date, setDate] = useState(dhakaDateKey());
  const [lines, setLines] = useState([blank()]);
  const [paid, setPaid] = useState("");
  const [remarks, setRemarks] = useState("");
  const [track, setTrack] = useState("");
  const [more, setMore] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const clientRef = useRef(newRef());
  const root = useRef(null);

  useEffect(() => {
    fetch("/api/products?limit=100").then((r) => r.json()).then((j) => j.ok ? setProducts(j.data.items) : toast(j.error, "error"));
  }, [toast]);

  const pmap = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);
  const options = useMemo(() => (products || []).map((p) => ({ value: p.id, label: p.name, sub: `${p.brand} · ${formatMoney(p.sellPrice)}` })), [products]);

  // ---- Sale Summary সূত্র (মাস্টার প্ল্যান ৮.২) ----
  const lineTotal = (l) => Math.round((Number(l.qty) || 0) * toPaisa(l.rate));
  const total = lines.reduce((s, l) => s + lineTotal(l), 0);
  const paidP = toPaisa(paid);
  const balance = customer?.balance ?? 0;
  const oldDue = Math.max(balance, 0);
  const advance = Math.max(-balance, 0);
  const remaining = balance + total - paidP; // < 0 হলে নতুন Advance
  const hasInput = !!customer || total > 0 || paidP > 0;

  const setLine = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const focusField = (i, field) => setTimeout(() => root.current?.querySelector(`[data-line="${i}"][data-field="${field}"]`)?.focus(), 30);

  function pickProduct(i, o) {
    const p = pmap.get(o.value);
    setLine(i, { productId: o.value, rate: String(toTaka(p.sellPrice)) });
  }
  function nextLine(i) {
    if (i === lines.length - 1) setLines((ls) => [...ls, blank()]);
    focusField(i + 1, "product");
  }

  function validate() {
    const e = {};
    if (!customer) e.customer = "Select a customer";
    const filled = lines.filter((l) => l.productId || l.qty || l.rate);
    const le = {};
    filled.forEach((l) => {
      if (!l.productId) le[l.key] = "Select a product";
      else if (!(Number(l.qty) > 0)) le[l.key] = "Enter a quantity";
      else if (l.rate === "" || Number(l.rate) < 0) le[l.key] = "Enter a selling price";
    });
    if (Object.keys(le).length) e.lines = le;
    if (paid !== "" && Number(paid) < 0) e.paid = "Paid amount can't be negative";
    if (!filled.length && !(paidP > 0)) e.general = "Add products for a sale, or enter a payment amount";
    setErrors(e);
    return { ok: !Object.keys(e).length, filled };
  }

  async function submit() {
    if (saving) return;
    const { ok, filled } = validate();
    if (!ok) return;
    setSaving(true);
    const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientRef: clientRef.current, customerId: customer.id, date, paid: paidP, remarks, trackNumber: track,
        items: filled.map((l) => ({ productId: l.productId, qty: Number(l.qty), rate: toPaisa(l.rate) })),
      }) }).then((r) => r.json()).catch(() => ({ ok: false, error: "Network problem. Check your connection and try again." }));
    setSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast(res.data.status === "approved" ? "Sale completed" : "Sent for approval");
    setDone({ ...res.data, customerName: customer.name });
  }

  function reset() {
    clientRef.current = newRef();
    setCustomer(null); setLines([blank()]); setPaid(""); setRemarks(""); setTrack(""); setErrors({}); setDone(null); setMore(false);
    setDate(dhakaDateKey());
    fetch("/api/products?limit=100").then((r) => r.json()).then((j) => j.ok && setProducts(j.data.items)); // স্টক রিফ্রেশ
  }

  if (done) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-navy-900">{done.status === "approved" ? "Sale completed" : "Sent for approval"}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {done.status === "approved" ? `${done.invoiceNo ? done.invoiceNo + " — " : ""}${done.customerName}'s ledger is updated.` : `${done.customerName}'s entry will appear in the ledger once an admin approves it.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>New sale</Button>
          {isAdmin && done.status === "approved" && (
            <Link href={`/customers/${done.customerId}`} className="inline-flex min-h-[40px] items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200">View customer ledger</Link>
          )}
        </div>
      </div>
    );
  }

  if (!products) return <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-48" /></div>;

  const Row = ({ label, value, strong, tone }) => (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-300">{label}</span>
      <span className={`${strong ? "text-lg font-bold" : "font-semibold"} ${tone || "text-white"}`}>{value}</span>
    </div>
  );

  return (
    <div ref={root} className="grid gap-5 pb-24 lg:grid-cols-[1fr_340px] lg:pb-0">
      <div className="space-y-5">
        <div className="card p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <div>
              <CustomerPicker value={customer} onChange={setCustomer} error={errors.customer} />
              <button type="button" onClick={() => setAddOpen(true)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"><UserPlus className="h-3.5 w-3.5" /> Add Customer</button>
            </div>
            <Input label="Sale date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button type="button" onClick={() => setMore(!more)} className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-700">{more ? "Hide extra details" : "More details (truck no., remarks)"}</button>
          {more && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Input label="Truck / Track no. (optional)" value={track} onChange={(e) => setTrack(e.target.value)} />
              <Textarea label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Sale Items</h3>
            <button type="button" onClick={() => { setLines([...lines, blank()]); focusField(lines.length, "product"); }} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"><Plus className="h-3.5 w-3.5" /> Add Product</button>
          </div>
          <div className="space-y-3">
            {lines.map((l, i) => {
              const p = pmap.get(l.productId);
              const err = errors.lines?.[l.key];
              const short = p && Number(l.qty) > p.stock;
              return (
                <div key={l.key} className={`rounded-lg border p-3 ${err ? "border-danger" : "border-slate-200"}`}>
                  <div className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                    <div><span className="field-label">Product</span>
                      <Combobox options={options} value={l.productId} placeholder="Search product" data-line={i} data-field="product"
                        onSelect={(o) => pickProduct(i, o)} onAfterSelect={() => focusField(i, "qty")} /></div>
                    <Input label="Quantity" type="number" min="0" step="any" inputMode="decimal" data-line={i} data-field="qty" value={l.qty}
                      onChange={(e) => setLine(i, { qty: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), focusField(i, "rate"))} />
                    <Input label="Selling price" type="number" min="0" step="0.01" inputMode="decimal" data-line={i} data-field="rate" value={l.rate}
                      onChange={(e) => setLine(i, { rate: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), nextLine(i))} />
                    <div><span className="field-label">Line total</span><div className="field flex items-center bg-slate-50 font-semibold">{formatMoney(lineTotal(l))}</div></div>
                    <button type="button" disabled={lines.length === 1 && !l.productId} onClick={() => setLines(lines.length === 1 ? [blank()] : lines.filter((_, k) => k !== i))}
                      aria-label="Remove line" className="grid h-10 w-10 place-items-center rounded-lg bg-red-50 text-danger hover:bg-red-100 disabled:opacity-40"><X className="h-4 w-4" /></button>
                  </div>
                  {p && <p className={`mt-2 flex items-center gap-1 text-xs ${short ? "text-amber-700" : "text-slate-500"}`}>
                    {short && <AlertTriangle className="h-3.5 w-3.5" />}
                    {short ? `Only ${p.stock} in stock — the sale will still go through.` : `In stock: ${p.stock}`}</p>}
                  {err && <p className="field-error">{err}</p>}
                </div>
              );
            })}
          </div>
          {errors.general && <p className="field-error mt-3">{errors.general}</p>}
        </div>
      </div>

      {/* Sale Summary */}
      <aside className="h-fit rounded-xl bg-navy-900 p-5 text-white shadow-card lg:sticky lg:top-4" aria-label="Sale summary">
        <h3 className="mb-2 text-base font-bold">Sale Summary</h3>
        <Row label="Total sale" value={formatMoney(total)} />
        <div className="flex items-center justify-between py-1.5 text-sm">
          <label htmlFor="paid" className="text-slate-300">Paid amount</label>
          <input id="paid" type="number" min="0" step="0.01" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0"
            className="h-9 w-32 rounded-md border-0 bg-white px-2 text-right text-sm font-semibold text-slate-900" aria-invalid={!!errors.paid} />
        </div>
        {errors.paid && <p className="text-xs text-red-300">{errors.paid}</p>}
        <Row label="Old customer due" value={formatMoney(oldDue)} />
        <Row label="Customer advance" value={formatMoney(advance)} />
        <div className="mt-1 border-t border-white/10 pt-2">
          <Row label={remaining < 0 ? "New advance after sale" : "Remaining customer due"} value={formatMoney(Math.abs(remaining))} strong tone={remaining > 0 ? "text-warning" : "text-emerald-300"} />
        </div>
        <Button variant="success" loading={saving} onClick={submit} className="mt-3 w-full">{isAdmin ? "Complete Sale →" : "Submit for approval →"}</Button>
        <p className="mt-3 rounded-lg bg-white/10 p-3 text-xs text-slate-200">
          {hasInput ? (isAdmin ? "This sale is added to the ledger and stock straight away." : "An admin will review this before it reaches the ledger.")
            : "Select a customer, add products for a sale, or enter advance payment."}
        </p>
      </aside>

      {/* মোবাইলে স্টিকি বটম বার */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-navy-900 px-4 py-3 text-white lg:hidden">
        <div><p className="text-[11px] text-slate-300">{remaining < 0 ? "New advance" : "Remaining due"}</p><p className="text-lg font-bold">{formatMoney(Math.abs(remaining))}</p></div>
        <Button variant="success" loading={saving} onClick={submit}>{isAdmin ? "Complete Sale →" : "Submit →"}</Button>
      </div>

      <AddCustomerModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={(c) => { setCustomer(c); setAddOpen(false); toast("Customer added"); }} />
    </div>
  );
}

function AddCustomerModal({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  async function save(e) {
    e.preventDefault();
    if (saving) return;
    const er = {};
    if (!f.name.trim()) er.name = "Customer name is required";
    if (f.phone && !/^01\d{9}$/.test(f.phone)) er.phone = "Phone must look like 01XXXXXXXXX";
    setErr(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }).then((r) => r.json());
    setSaving(false);
    if (!res.ok) return toast(res.error, "error");
    if (res.data.warning) toast(res.data.warning, "error");
    setF({ name: "", phone: "", address: "" });
    onCreated(res.data);
  }
  return (
    <Modal open={open} onClose={onClose} title="Add customer">
      <form onSubmit={save} className="space-y-3">
        <Input label="Customer name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={err.name} autoFocus />
        <Input label="Phone number" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={err.phone} />
        <Input label="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Save customer</Button></div>
      </form>
    </Modal>
  );
}
