"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays, CheckCheck, CheckCircle2, ClipboardCheck, Clock, Filter, HandCoins, MessageSquareText,
  Phone, ShoppingCart, Truck, UserRound, X, XCircle,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";

export default function ApprovalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [staff, setStaff] = useState("");
  const [date, setDate] = useState("");
  const [action, setAction] = useState(null); // { type, sale }
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const p = new URLSearchParams({ status: "pending", page });
    if (staff) p.set("staff", staff);
    if (date) p.set("date", date);
    fetch(`/api/approvals?${p}`).then((r) => r.json()).then((j) => j.ok ? setData(j.data) : toast(j.error, "error"));
  }, [page, staff, date, toast]);
  useEffect(load, [load]);

  async function run() {
    if (busy) return; // ডাবল-ক্লিক সুরক্ষা
    setBusy(true);
    const { type, sale } = action;
    const res = await fetch(`/api/approvals/${sale.id}/${type}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) }).then((r) => r.json());
    setBusy(false);
    if (!res.ok) { toast(res.error, "error"); setAction(null); return load(); }
    toast(type === "approve" ? `Approved${res.data.invoiceNo ? ` — ${res.data.invoiceNo}` : ""}` : "Request declined");
    setAction(null); setNote("");
    load(); router.refresh(); // সাইডবারের ব্যাজ আপডেট
  }

  return (
    <>
      <PageHeader group="Approval Section" title="Review & approve">
        <Link href="/dashboard" className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/20 md:inline-flex">Dashboard</Link>
      </PageHeader>
      <main className="page">
        <div>
          <h2 className="page-title">Approval Section</h2>
          <p className="page-subtitle">Review user POS submissions before they enter the main records.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-gold-500 p-5 text-white shadow-lg shadow-amber-500/20">
            <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15" aria-hidden />
            <div className="relative flex items-center justify-between">
              <p className="text-sm font-medium text-white/90">Pending Requests</p>
              <span className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm"><ClipboardCheck className="h-5 w-5" aria-hidden /></span>
            </div>
            <p className="num relative mt-1 text-4xl font-bold">{data ? data.pendingTotal : "…"}</p>
            <p className="relative mt-1 text-xs text-white/85">Each request has its own Approve or Decline action.</p>
          </div>
          <div className="card flex flex-wrap items-end gap-4 p-5">
            <div className="flex items-center gap-2 self-center text-sm font-semibold text-navy-900"><Filter className="h-4 w-4 text-slate-400" aria-hidden /> Filters</div>
            <Select label="Submitted by" value={staff} onChange={(e) => { setStaff(e.target.value); setPage(1); }} className="min-w-[200px] flex-1">
              <option value="">All staff</option>
              {(data?.staff || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Sale date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} className="min-w-[180px] flex-1" />
            {(staff || date) && (
              <Button variant="ghost" onClick={() => { setStaff(""); setDate(""); setPage(1); }}><X className="h-4 w-4" aria-hidden /> Clear</Button>
            )}
          </div>
        </div>

        {!data ? <div className="space-y-4"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
          : !data.items.length ? <div className="card"><EmptyState icon={CheckCheck} title="All caught up" hint={staff || date ? "No pending requests match these filters." : "No pending requests right now."} /></div>
          : (
            <div className="space-y-5">
              {data.items.map((s) => {
                const dueNow = Math.max(s.total - s.paid, 0);
                const collectionOnly = !s.items.length;
                return (
                  <article key={s.id} className="card overflow-hidden">
                    <div className={`h-1 ${collectionOnly ? "bg-gradient-to-r from-purple-500 to-indigo-600" : "bg-gradient-to-r from-brand-500 to-brand-700"}`} aria-hidden />
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-10 w-10 place-items-center rounded-xl ${collectionOnly ? "bg-indigo-50 text-indigo-600" : "bg-brand-50 text-brand-600"}`}>
                          {collectionOnly ? <HandCoins className="h-5 w-5" aria-hidden /> : <ShoppingCart className="h-5 w-5" aria-hidden />}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold tracking-wide text-navy-900">POS SALE</h3>
                            {collectionOnly && <span className="badge bg-indigo-50 text-indigo-700 ring-indigo-600/20">Due Collection Entry</span>}
                          </div>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <UserRound className="h-3.5 w-3.5" aria-hidden /> <b className="font-semibold text-slate-700">{s.submittedBy}</b>
                            <span aria-hidden>·</span>
                            <Clock className="h-3.5 w-3.5" aria-hidden /> <span className="num">{formatDate(s.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </p>
                        </div>
                      </div>
                      <span className="badge badge-warning"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden /> PENDING</span>
                    </div>

                    <div className="space-y-4 p-5">
                      <dl className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 text-sm sm:grid-cols-4">
                        {[
                          ["Truck / Track No.", s.trackNumber || "—", Truck],
                          ["Customer", s.customer.name, UserRound],
                          ["Mobile", s.customer.phone || "—", Phone],
                          ["Sale Date", formatDate(s.date), CalendarDays],
                        ].map(([l, v, Icon]) => (
                          <div key={l} className="bg-slate-50/80 px-4 py-3">
                            <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><Icon className="h-3 w-3" aria-hidden />{l}</dt>
                            <dd className={`mt-1 truncate font-semibold text-navy-900 ${l === "Mobile" || l === "Sale Date" ? "num" : ""}`}>{v}</dd>
                          </div>
                        ))}
                      </dl>

                      {collectionOnly ? (
                        <div className="flex items-center gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-800">
                          <HandCoins className="h-4 w-4 shrink-0" aria-hidden />
                          No products — this entry only records a due payment of <b className="num">{formatMoney(s.paid)}</b> from the customer.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full min-w-[480px]">
                            <thead><tr><th className="th">Product</th><th className="th text-right">Quantity</th><th className="th text-right">Selling Rate</th><th className="th text-right">Line Total</th></tr></thead>
                            <tbody className="rows">
                              {s.items.map((i, k) => (
                                <tr key={k}>
                                  <td className="td font-medium text-navy-900">{i.name}</td>
                                  <td className="td num text-right">{i.qty}</td>
                                  <td className="td num text-right">{formatMoney(i.rate)}</td>
                                  <td className="td num text-right font-semibold text-navy-900">{formatMoney(i.lineTotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <dl className="grid gap-3 text-sm sm:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 px-4 py-3"><dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Address</dt><dd className="mt-1 text-slate-700">{s.customer.address || "—"}</dd></div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3"><dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total</dt><dd className="num mt-1 font-bold text-navy-900">{formatMoney(s.total)}</dd></div>
                        <div className="rounded-xl bg-emerald-50/70 px-4 py-3 ring-1 ring-inset ring-emerald-600/10"><dt className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Pay</dt><dd className="num mt-1 font-bold text-emerald-700">{formatMoney(s.paid)}</dd></div>
                        <div className="rounded-xl bg-rose-50/70 px-4 py-3 ring-1 ring-inset ring-rose-600/10"><dt className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Due on this sale</dt><dd className="num mt-1 font-bold text-rose-700">{formatMoney(dueNow)}</dd></div>
                      </dl>
                      {s.remarks && (
                        <p className="flex gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-600/20">
                          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span><b>Remarks:</b> {s.remarks}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
                      <Button variant="danger-ghost" onClick={() => { setNote(""); setAction({ type: "decline", sale: s }); }}><XCircle className="h-4 w-4" aria-hidden /> Decline</Button>
                      <Button variant="success" onClick={() => setAction({ type: "approve", sale: s })}><CheckCircle2 className="h-4 w-4" aria-hidden /> Approve &amp; Add to Software</Button>
                    </div>
                  </article>
                );
              })}
              <div className="card"><Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} /></div>
            </div>
          )}
      </main>

      <Modal open={!!action} onClose={() => !busy && setAction(null)} title={action?.type === "approve" ? "Approve this request?" : "Decline this request?"}>
        {action && (
          <>
            <p className="mb-4 text-sm text-slate-600">
              {action.type === "approve"
                ? `${action.sale.customer.name} — total ${formatMoney(action.sale.total)}, paid ${formatMoney(action.sale.paid)}. It will be added to the ledger and stock now. This can't be undone.`
                : `${action.sale.customer.name}'s request will be rejected. Nothing changes in the ledger or stock.`}
            </p>
            {action.type === "decline" && <Input label="Reason (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="mb-4" />}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={busy} onClick={() => setAction(null)}>Cancel</Button>
              <Button variant={action.type === "approve" ? "success" : "danger"} loading={busy} onClick={run}>{action.type === "approve" ? "Approve" : "Decline"}</Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
