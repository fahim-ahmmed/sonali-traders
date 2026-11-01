"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, ChevronDown } from "lucide-react";
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
      <main className="p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-navy-900">{dueOnly ? "Due Customer" : "Customer List"}</h2>
            <p className="text-sm text-slate-500">{dueOnly ? "Customers who still owe money, highest due first." : "Track cement and rod customers with complete purchase and payment ledgers."}</p>
          </div>
          <Link href="/customers/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Add Customer</Link>
        </div>

        <div className="card mb-5 overflow-hidden">
          <button onClick={() => setShowDue(!showDue)} className="flex w-full items-center justify-between px-5 py-4 text-left" aria-expanded={showDue}>
            <span className="text-sm font-bold text-navy-900">Add Old Customer Due</span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showDue ? "rotate-180" : ""}`} />
          </button>
          {showDue && (
            <form onSubmit={saveDue} className="grid items-start gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr_auto]">
              <CustomerPicker value={due.customer} onChange={(c) => setDue({ ...due, customer: c })} error={dueErr.customer} />
              <Input label="Due amount" type="number" min="0" step="0.01" inputMode="decimal" value={due.amount} onChange={(e) => setDue({ ...due, amount: e.target.value })} error={dueErr.amount} />
              <Input label="Date" type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} />
              <Input label="Note (optional)" value={due.note} onChange={(e) => setDue({ ...due, note: e.target.value })} />
              <Button type="submit" loading={dueSaving} className="lg:mt-5">Save due</Button>
            </form>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or address" aria-label="Search customers" className="field pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {TABS.map(([v, label]) => (
                <button key={v} onClick={() => setParam("category", v)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${category === v ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
              ))}
              <button onClick={() => setParam("sort", sortDue ? "" : "due")} disabled={dueOnly}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${sortDue || dueOnly ? "bg-gold-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Highest due first</button>
              <button onClick={() => setParam("due", dueOnly ? "" : "1")}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${dueOnly ? "bg-danger text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Only with due</button>
            </div>
          </div>

          {!data ? <div className="space-y-2 p-5">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : !data.items.length ? (
              <EmptyState title={dq || category || dueOnly ? "No customers match" : "No customers yet"}
                hint={dueOnly && !dq ? "Nobody owes money right now." : dq || category ? "Try a different search or tab." : "Add your first customer to start recording sales."}
                actionHref={dq || category || dueOnly ? undefined : "/customers/create"} actionLabel="Add customer" />
            ) : (
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[760px]">
                  <thead><tr><th className="th">Customer name</th><th className="th">Phone</th><th className="th">Address</th><th className="th text-right">Due amount</th><th className="th text-right">Advance</th><th className="th text-right">Full ledger</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="td"><Link href={`/customers/${c.id}`} className="font-semibold text-brand-600 hover:underline">{c.name}</Link>
                          {c.tags?.map((t) => <span key={t} className="ml-2"><Badge tone="info">{t === "cement" ? "Cement" : "Rod"}</Badge></span>)}</td>
                        <td className="td">{c.phone || "—"}</td>
                        <td className="td">{c.address || "—"}</td>
                        <td className={`td text-right font-semibold ${c.due > 0 ? "text-danger" : "text-slate-400"}`}>{formatMoney(c.due)}</td>
                        <td className={`td text-right font-semibold ${c.advance > 0 ? "text-success" : "text-slate-400"}`}>{formatMoney(c.advance)}</td>
                        <td className="td whitespace-nowrap text-right">
                          <Link href={`/customers/${c.id}`} className="mr-2 text-xs font-semibold text-brand-600 hover:underline">View Ledger →</Link>
                          <Link href={`/customers/${c.id}/edit`} className="mr-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Edit</Link>
                          <button onClick={() => setDeleting(c)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100">Delete</button>
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
        title="Delete customer?" message={deleting ? `${deleting.name} will be removed. A customer with a due or advance balance can't be deleted, and one with ledger history is archived so records stay correct.` : ""} />
    </>
  );
}
