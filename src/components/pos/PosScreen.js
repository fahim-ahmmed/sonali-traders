"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, Loader2, PackageOpen, Plus, Trash2, UserPlus, UserRound } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import ProductSelect from "@/components/shared/ProductSelect";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import CustomerPicker from "@/components/forms/CustomerPicker";
import { dhakaDateKey } from "@/lib/dates";
import { formatMoney, toPaisa, toTaka } from "@/lib/money";

const newRef = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
let seq = 0;
const blank = () => ({ key: ++seq, productId: "", product: null, qty: "", rate: "" });

export default function PosScreen({ isAdmin }) {
  const { toast } = useToast();
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

  function pickProduct(i, p) {
    setLine(i, { productId: p.id, product: p, rate: String(toTaka(p.sellPrice)) });
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
  }

  if (done) {
    const approved = done.status === "approved";
    return (
      <div className="card mx-auto max-w-lg animate-scale-in overflow-hidden text-center">
        <div className={`h-1.5 ${approved ? "bg-success" : "bg-warning"}`} aria-hidden />
        <div className="p-8">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${approved ? "bg-emerald-50 ring-8 ring-emerald-50/60" : "bg-amber-50 ring-8 ring-amber-50/60"}`}>
            <CheckCircle2 className={`h-8 w-8 ${approved ? "text-success" : "text-amber-500"}`} aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-bold text-navy-900">{approved ? "Sale completed" : "Sent for approval"}</h2>
          {approved && done.invoiceNo && <p className="num mt-2"><span className="badge badge-info">{done.invoiceNo}</span></p>}
          <p className="mt-2 text-sm text-slate-500">
            {approved ? `${done.customerName}'s ledger is updated.` : `${done.customerName}'s entry will appear in the ledger once an admin approves it.`}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Button onClick={reset}><Plus className="h-4 w-4" aria-hidden /> New sale</Button>
            {isAdmin && approved && (
              <Link href={`/customers/${done.customerId}`} className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">View customer ledger</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const Row = ({ label, value, strong, tone }) => (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`num ${strong ? "text-xl font-bold" : "font-semibold"} ${tone || "text-white"}`}>{value}</span>
    </div>
  );

  return (
    <div ref={root} className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-12 lg:pb-0">
      <div className="space-y-6 lg:col-span-8">
        {/* কাস্টমার ও তারিখ */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><UserRound className="h-4 w-4" aria-hidden /></span>
              <h3 className="card-title">Customer</h3>
            </div>
            <button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100">
              <UserPlus className="h-3.5 w-3.5" aria-hidden /> Add Customer
            </button>
          </div>
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_190px]">
              <CustomerPicker value={customer} onChange={setCustomer} error={errors.customer} />
              <Input label="Sale Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button type="button" onClick={() => setMore(!more)} aria-expanded={more}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-navy-900">
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${more ? "rotate-180" : ""}`} aria-hidden />
              {more ? "Hide extra details" : "Truck / Track No. & Remarks"}
            </button>
            {more && (
              <div className="mt-3 grid animate-fade-in gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
                <Input label="Truck / Track No. (optional)" value={track} onChange={(e) => setTrack(e.target.value)} />
                <Textarea label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>
            )}
          </div>
        </section>

        {/* প্রোডাক্ট লাইন */}
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-500/10 text-gold-600"><PackageOpen className="h-4 w-4" aria-hidden /></span>
              <h3 className="card-title">Sale Items</h3>
              <span className="badge badge-neutral num">{lines.length}</span>
            </div>
            <button type="button" onClick={() => { setLines([...lines, blank()]); focusField(lines.length, "product"); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]">
              <Plus className="h-3.5 w-3.5" aria-hidden /> Add Product
            </button>
          </div>
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_40px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:grid">
            <span>Product</span><span>Quantity</span><span>Selling Price</span><span className="text-right">Line Total</span><span />
          </div>
          <div className="divide-y divide-slate-100">
            {lines.map((l, i) => {
              const p = l.product;
              const err = errors.lines?.[l.key];
              const short = p && Number(l.qty) > p.stock;
              return (
                <div key={l.key} className={`px-5 py-4 transition-colors ${err ? "bg-rose-50/40" : "hover:bg-slate-50/50"}`}>
                  <div className="grid items-center gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_40px]">
                    <div>
                      <span className="field-label sm:hidden">Product</span>
                      <ProductSelect label="" value={l.productId} selectedProduct={l.product} placeholder="Search product" inputProps={{ "data-line": i, "data-field": "product", "aria-label": "Product" }}
                        onSelect={(product) => { pickProduct(i, product); focusField(i, "qty"); }} />
                    </div>
                    <div>
                      <span className="field-label sm:hidden">Quantity</span>
                      <input type="number" min="0" step="any" inputMode="decimal" data-line={i} data-field="qty" value={l.qty} placeholder="0" aria-label="Quantity"
                        className="field num" onChange={(e) => setLine(i, { qty: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), focusField(i, "rate"))} />
                    </div>
                    <div>
                      <span className="field-label sm:hidden">Selling Price</span>
                      <input type="number" min="0" step="0.01" inputMode="decimal" data-line={i} data-field="rate" value={l.rate} placeholder="0.00" aria-label="Selling price"
                        className="field num" onChange={(e) => setLine(i, { rate: e.target.value })} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), nextLine(i))} />
                    </div>
                    <div className="flex items-center justify-between sm:block sm:text-right">
                      <span className="field-label mb-0 sm:hidden">Line Total</span>
                      <span className="num text-sm font-semibold text-navy-900">{formatMoney(lineTotal(l))}</span>
                    </div>
                    <button type="button" disabled={lines.length === 1 && !l.productId} onClick={() => setLines(lines.length === 1 ? [blank()] : lines.filter((_, k) => k !== i))}
                      aria-label="Remove line" className="grid h-10 w-10 place-items-center justify-self-end rounded-xl text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-30">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {p && (
                    <p className={`mt-2 flex items-center gap-1.5 text-xs ${short ? "text-amber-700" : "text-slate-500"}`}>
                      {short ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />}
                      {short
                        ? <>Only <b className="num">{p.stock}</b> in stock — the sale will still go through.</>
                        : <>In stock: <b className="num font-semibold text-slate-700">{p.stock}</b></>}
                    </p>
                  )}
                  {err && <p className="field-error">{err}</p>}
                </div>
              );
            })}
          </div>
          {errors.general && <p className="field-error border-t border-slate-100 px-5 py-3">{errors.general}</p>}
        </section>
      </div>

      {/* Sale Summary */}
      <aside className="h-fit rounded-2xl border border-white/10 bg-navy-900 p-6 text-white shadow-2xl shadow-navy-900/30 lg:sticky lg:top-24 lg:col-span-4" aria-label="Sale summary">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Sale Summary</h3>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">{isAdmin ? "Instant" : "Needs approval"}</span>
        </div>
        <div className="divide-y divide-white/10">
          <Row label="Total Sale" value={formatMoney(total)} strong />
          <div className="py-3">
            <label htmlFor="paid" className="mb-1.5 block text-sm text-slate-400">Paid Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">৳</span>
              <input id="paid" type="number" min="0" step="0.01" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0.00"
                className="num h-12 w-full rounded-xl border-2 border-transparent bg-white pl-8 pr-3.5 text-right text-lg font-bold text-navy-900 shadow-inner transition-all focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/25"
                aria-invalid={!!errors.paid} />
            </div>
            {errors.paid && <p className="mt-1 text-xs text-rose-300">{errors.paid}</p>}
          </div>
          <Row label="Old Customer Due" value={formatMoney(oldDue)} tone={oldDue > 0 ? "text-rose-300" : "text-white"} />
          <Row label="Customer Advance" value={formatMoney(advance)} tone={advance > 0 ? "text-emerald-300" : "text-white"} />
        </div>
        <div className={`mt-3 rounded-xl px-4 py-3 ring-1 ring-inset ${remaining > 0 ? "bg-amber-400/10 ring-amber-400/30" : "bg-emerald-400/10 ring-emerald-400/30"}`}>
          <p className="text-xs font-medium text-slate-300">{remaining < 0 ? "New Advance After Sale" : "Remaining Customer Due"}</p>
          <p className={`num mt-0.5 text-2xl font-bold ${remaining > 0 ? "text-amber-300" : "text-emerald-300"}`}>{formatMoney(Math.abs(remaining))}</p>
        </div>
        <button type="button" disabled={saving} onClick={submit}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 active:scale-[.99] disabled:pointer-events-none disabled:opacity-70">
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isAdmin ? "Complete Sale →" : "Submit for approval →"}
        </button>
        <p className="mt-3 flex gap-2 rounded-xl bg-white/5 p-3 text-xs leading-relaxed text-slate-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          {hasInput ? (isAdmin ? "This sale is added to the ledger and stock straight away." : "An admin will review this before it reaches the ledger.")
            : "Select a customer, add products for a sale, or enter advance payment."}
        </p>
      </aside>

      {/* মোবাইলে স্টিকি বটম বার */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-white/10 bg-navy-900/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md lg:hidden">
        <div>
          <p className="text-[11px] text-slate-400">Total <span className="num font-semibold text-white">{formatMoney(total)}</span> · {remaining < 0 ? "New advance" : "Remaining due"}</p>
          <p className={`num text-lg font-bold ${remaining > 0 ? "text-amber-300" : "text-emerald-300"}`}>{formatMoney(Math.abs(remaining))}</p>
        </div>
        <button type="button" disabled={saving} onClick={submit}
          className="flex items-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 active:scale-[.98] disabled:opacity-70">
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isAdmin ? "Complete Sale →" : "Submit →"}
        </button>
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
      <form onSubmit={save} className="space-y-4">
        <Input label="Customer name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={err.name} autoFocus />
        <Input label="Phone number" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} error={err.phone} placeholder="01XXXXXXXXX" />
        <Input label="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Save customer</Button></div>
      </form>
    </Modal>
  );
}
