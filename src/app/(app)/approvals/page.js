"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Feedback";
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
        <Link href="/dashboard" className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">Dashboard</Link>
      </PageHeader>
      <main className="p-5 sm:p-8">
        <h2 className="text-xl font-bold text-navy-900">Approval Section</h2>
        <p className="text-sm text-slate-500">Review user POS submissions before they enter the main records.</p>
        <p className="mb-4 mt-2 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">{data ? data.pendingTotal : "…"} pending requests. Each request below has its own Approve or Decline action.</p>

        <div className="mb-5 grid max-w-xl gap-3 sm:grid-cols-2">
          <Select label="Submitted by" value={staff} onChange={(e) => { setStaff(e.target.value); setPage(1); }}>
            <option value="">All staff</option>
            {(data?.staff || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="Sale date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
        </div>

        {!data ? <div className="space-y-3"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>
          : !data.items.length ? <div className="card"><EmptyState title="All caught up" hint={staff || date ? "No pending requests match these filters." : "No pending requests right now."} /></div>
          : (
            <div className="space-y-4">
              {data.items.map((s) => {
                const dueNow = Math.max(s.total - s.paid, 0);
                return (
                  <article key={s.id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-brand-600">{s.items.length ? "POS SALE" : "POS COLLECTION"}</h3>
                        <p className="text-xs text-slate-500">Submitted by <b className="text-slate-700">{s.submittedBy}</b> · {formatDate(s.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <Badge tone="warning">PENDING</Badge>
                    </div>
                    <dl className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4">
                      <div><dt className="text-[11px] uppercase text-slate-500">Truck / Track no.</dt><dd>{s.trackNumber || "—"}</dd></div>
                      <div><dt className="text-[11px] uppercase text-slate-500">Customer</dt><dd className="font-semibold">{s.customer.name}</dd></div>
                      <div><dt className="text-[11px] uppercase text-slate-500">Mobile</dt><dd>{s.customer.phone || "—"}</dd></div>
                      <div><dt className="text-[11px] uppercase text-slate-500">Sale date</dt><dd>{formatDate(s.date)}</dd></div>
                    </dl>
                    {s.items.length > 0 && (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[420px]">
                          <thead><tr><th className="th">Product</th><th className="th text-right">Quantity</th><th className="th text-right">Selling rate</th><th className="th text-right">Line total</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">{s.items.map((i, k) => <tr key={k}><td className="td">{i.name}</td><td className="td text-right">{i.qty}</td><td className="td text-right">{formatMoney(i.rate)}</td><td className="td text-right">{formatMoney(i.lineTotal)}</td></tr>)}</tbody>
                        </table>
                      </div>
                    )}
                    <dl className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-4">
                      <div><dt className="text-[11px] uppercase text-slate-500">Address</dt><dd>{s.customer.address || "—"}</dd></div>
                      <div><dt className="text-[11px] uppercase text-slate-500">Total</dt><dd className="font-semibold">{formatMoney(s.total)}</dd></div>
                      <div><dt className="text-[11px] uppercase text-slate-500">Pay</dt><dd className="font-semibold text-success">{formatMoney(s.paid)}</dd></div>
                      <div><dt className="text-[11px] uppercase text-slate-500">Due on this sale</dt><dd className="font-semibold text-danger">{formatMoney(dueNow)}</dd></div>
                    </dl>
                    {s.remarks && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm"><b>Remarks:</b> {s.remarks}</p>}
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="danger" onClick={() => { setNote(""); setAction({ type: "decline", sale: s }); }}>Decline</Button>
                      <Button variant="success" onClick={() => setAction({ type: "approve", sale: s })}>Approve &amp; Add to Software</Button>
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
