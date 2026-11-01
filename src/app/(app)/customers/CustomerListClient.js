"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown, FilePlus2, Pencil, Plus, Search, Trash2, Users, X } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CustomerPicker from "@/components/forms/CustomerPicker";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey } from "@/lib/dates";
import { formatMoney, toPaisa } from "@/lib/money";

const TABS = [["", "All Customers"], ["cement", "Cement Customers"], ["rod", "Rod Customers"]];

export default function CustomerListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();
  const category = sp.get("category") || "";
  const dueOnly = sp.get("due") === "1";
  const sortDue = sp.get("sort") === "due";

  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  // Old Due ফর্ম (collapsible)
  const [showDue, setShowDue] = useState(false);
  const [due, setDue] = useState({ customer: null, amount: "", date: dhakaDateKey(), note: "" });
  const [dueErr, setDueErr] = useState({});
  const [dueSaving, setDueSaving] = useState(false);

  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);

  const setParam = (k, v) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    setPage(1);
    router.replace(`/customers${p.toString() ? `?${p}` : ""}`);
  };

  const load = useCallback(() => {
    const p = new URLSearchParams({ page, limit: 25 });
    if (dq) p.set("q", dq);
    if (category) p.set("category", category);
    if (dueOnly) p.set("due", "1");
    if (sortDue) p.set("sort", "due");
    fetch(`/api/customers?${p}`).then((r) => r.json()).then((j) => j.ok ? setData(j.data) : toast(j.error, "error"));
  }, [page, dq, category, dueOnly, sortDue, toast]);
  useEffect(load, [load]);

  async function saveDue(e) {
    e.preventDefault();
    if (dueSaving) return;
    const er = {};
    if (!due.customer) er.customer = "Select a customer";
    if (!(Number(due.amount) > 0)) er.amount = "Enter an amount more than 0";
    setDueErr(er);
    if (Object.keys(er).length) return;
    setDueSaving(true);
    const res = await fetch("/api/customers/opening-due", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: due.customer.id, amount: toPaisa(due.amount), date: due.date, note: due.note }) }).then((r) => r.json());
    setDueSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Old due added to the ledger");
    setDue({ customer: null, amount: "", date: dhakaDateKey(), note: "" });
    setShowDue(false); load();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/customers/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false); setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast(res.data.archived ? "Customer archived (ledger kept)" : "Customer deleted"); load();
  }

  return (
    <>
      <PageHeader group={dueOnly ? "Customer / Due Customer" : "Customer / Customer List"} title="Customer management" />
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-title">{dueOnly ? "Due Customer" : "Customer List"}</h2>
            <p className="page-subtitle">{dueOnly ? "Customers who still owe money, highest due first." : "Track cement and rod customers with complete purchase and payment ledgers."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowDue(!showDue)} aria-expanded={showDue}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all ${showDue ? "border-gold-500 bg-gold-500/10 text-gold-600" : "border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(11,34,57,0.04)] hover:bg-slate-50"}`}>
              <FilePlus2 className="h-4 w-4" aria-hidden /> Add Old Customer Due
              <ChevronDown className={`h-4 w-4 transition-transform ${showDue ? "rotate-180" : ""}`} aria-hidden />
            </button>
            <Link href="/customers/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]">
              <Plus className="h-4 w-4" aria-hidden /> Add Customer
            </Link>
          </div>
        </div>

        {showDue && (
          <section className="card animate-fade-in border-gold-500/30">
            <div className="card-header">
              <div>
                <h3 className="card-title">Add Old Customer Due</h3>
                <p className="mt-0.5 text-xs text-slate-500">Record a due from before this software. It is not counted as a sale.</p>
              </div>
              <button onClick={() => setShowDue(false)} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-900"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={saveDue} className="grid items-start gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr_auto]">
              <CustomerPicker value={due.customer} onChange={(c) => setDue({ ...due, customer: c })} error={dueErr.customer} />
              <Input label="Due amount" type="number" min="0" step="0.01" inputMode="decimal" value={due.amount} onChange={(e) => setDue({ ...due, amount: e.target.value })} error={dueErr.amount} />
              <Input label="Date" type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} />
              <Input label="Note (optional)" value={due.note} onChange={(e) => setDue({ ...due, note: e.target.value })} />
              <Button type="submit" variant="gold" loading={dueSaving} className="lg:mt-[22px]">Save due</Button>
            </form>
          </section>
        )}

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or address" aria-label="Search customers" className="field pl-10" />
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Customer type">
              {TABS.map(([v, label]) => (
                <button key={v} role="tab" aria-selected={category === v} onClick={() => setParam("category", v)} className={`pill ${category === v ? "pill-active" : ""}`}>{label}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <button onClick={() => setParam("sort", sortDue ? "" : "due")} disabled={dueOnly}
                className={`pill disabled:opacity-50 ${sortDue || dueOnly ? "border-gold-500 bg-gold-500 text-white hover:border-gold-500 hover:text-white" : ""}`}>Highest due first</button>
              <button onClick={() => setParam("due", dueOnly ? "" : "1")}
                className={`pill ${dueOnly ? "border-danger bg-danger text-white hover:border-danger hover:text-white" : ""}`}>Only with due</button>
            </div>
          </div>

          {!data ? <div className="space-y-2 p-5">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : !data.items.length ? (
              <EmptyState icon={Users} title={dq || category || dueOnly ? "No customers match" : "No customers yet"}
                hint={dueOnly && !dq ? "Nobody owes money right now." : dq || category ? "Try a different search or tab." : "Add your first customer to start recording sales."}
                actionHref={dq || category || dueOnly ? undefined : "/customers/create"} actionLabel="Add Customer" />
            ) : (
              <div className="table-wrap max-h-[70vh]">
                <table className="w-full min-w-[860px]">
                  <thead><tr>
                    <th className="th">Customer Name</th><th className="th">Phone</th><th className="th">Address</th>
                    <th className="th text-right">Due Amount</th><th className="th text-right">Advance Payment</th><th className="th text-right">Actions</th>
                  </tr></thead>
                  <tbody className="rows">
                    {data.items.map((c) => (
                      <tr key={c.id}>
                        <td className="td">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{(c.name || "?").slice(0, 2).toUpperCase()}</span>
                            <div className="min-w-0">
                              <Link href={`/customers/${c.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{c.name}</Link>
                              {!!c.tags?.length && <div className="mt-0.5 flex gap-1">{c.tags.map((t) => <Badge key={t} tone={t === "cement" ? "info" : "neutral"}>{t === "cement" ? "Cement" : "Rod"}</Badge>)}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="td num">{c.phone || "—"}</td>
                        <td className="td max-w-[220px] truncate text-slate-500">{c.address || "—"}</td>
                        <td className="td text-right">{c.due > 0 ? <span className="badge badge-danger num">{formatMoney(c.due)}</span> : <span className="num text-slate-400">{formatMoney(0)}</span>}</td>
                        <td className="td text-right">{c.advance > 0 ? <span className="badge badge-success num">{formatMoney(c.advance)}</span> : <span className="num text-slate-400">{formatMoney(0)}</span>}</td>
                        <td className="td whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link href={`/customers/${c.id}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50">
                              View Ledger <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                            <Link href={`/customers/${c.id}/edit`} aria-label={`Edit ${c.name}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700">
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
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
        </section>
      </main>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy}
        title="Delete customer?" message={deleting ? `${deleting.name} will be removed. A customer with a due or advance balance can't be deleted, and one with ledger history is archived so records stay correct.` : ""} />
    </>
  );
}
