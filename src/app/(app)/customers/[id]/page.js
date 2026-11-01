"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey, formatDate } from "@/lib/dates";
import { formatMoney, toPaisa } from "@/lib/money";

const TYPE = { sale: ["Sale", "info"], payment: ["Payment", "success"], opening_due: ["Old Customer Due", "warning"], advance: ["Advance", "success"] };

export default function CustomerLedgerPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [d, setD] = useState(null);
  const [company, setCompany] = useState(null);
  const [pay, setPay] = useState({ amount: "", date: dhakaDateKey(), note: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/customers/${id}`).then((r) => r.json()).then((j) => j.ok ? setD(j.data) : toast(j.error, "error"));
  }, [id, toast]);
  useEffect(load, [load]);
  useEffect(() => { fetch("/api/settings").then((r) => r.json()).then((j) => j.ok && setCompany(j.data)); }, []);

  async function receive(e) {
    e.preventDefault();
    if (saving) return;
    if (!(Number(pay.amount) > 0)) return setErr("Enter an amount more than 0");
    setErr(""); setSaving(true);
    const res = await fetch(`/api/customers/${id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: toPaisa(pay.amount), date: pay.date, note: pay.note }) }).then((r) => r.json());
    setSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Payment saved");
    setPay({ amount: "", date: dhakaDateKey(), note: "" });
    load();
  }

  const c = d?.customer;
  const s = d?.summary;
  return (
    <>
      <PageHeader group="Customer / Ledger" title="Customer management" />
      <main className="p-5 sm:p-8">
        <div className="no-print mb-3 flex items-center justify-between">
          <Link href="/customers" className="text-xs font-semibold text-brand-600 hover:underline">← Customer List</Link>
          <div className="flex gap-2">
            <Link href={`/customers/${id}/edit`} className="inline-flex min-h-[40px] items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200">Edit</Link>
            <Button onClick={() => window.print()} disabled={!d}><Printer className="h-4 w-4" /> Print Ledger</Button>
          </div>
        </div>

        {/* শুধু প্রিন্টে দেখা যায় */}
        <div className="print-only mb-4 border-b border-slate-300 pb-3">
          <div className="flex items-center gap-3">
            {company?.logoUrl && <img src={company.logoUrl} alt="" className="h-14 w-auto" />}
            <div>
              <p className="text-lg font-bold">{company?.companyName || "Sonali Trading"}</p>
              <p className="text-xs">{[company?.address, company?.phone && `Phone: ${company.phone}`, company?.hotline && `Hotline: ${company.hotline}`].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold">Customer Ledger — printed {formatDate(new Date())}</p>
        </div>

        {!d ? <div className="space-y-3"><Skeleton className="h-10 w-72" /><Skeleton className="h-24" /><Skeleton className="h-48" /></div> : (
          <>
            <h2 className="text-xl font-bold text-navy-900">{c.name}</h2>
            <p className="mb-4 text-sm text-slate-500">{[c.phone, c.address].filter(Boolean).join(" · ") || "No contact details"}</p>

            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[["Total purchases", s.totalPurchases, "text-navy-900"], ["Total payments", s.totalPayments, "text-success"],
                ["Current due", s.due, s.due > 0 ? "text-danger" : "text-success"], ["Available advance", s.advance, "text-success"]].map(([l, v, col]) => (
                <div key={l} className="card p-4"><p className="text-xs text-slate-500">{l}</p><p className={`text-xl font-bold ${col}`}>{formatMoney(v)}</p></div>
              ))}
            </div>
            {s.due === 0 && s.advance === 0 && <div className="no-print mb-4"><Badge tone="success">All settled</Badge></div>}

            <form onSubmit={receive} className="card no-print mb-5 p-5">
              <h3 className="mb-3 text-sm font-bold text-navy-900">Receive Due Payment</h3>
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
                <Input label="Payment amount" type="number" min="0" step="0.01" inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} error={err} />
                <Input label="Date" type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} />
                <Input label="Payment note" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
                <Button type="submit" loading={saving} variant="success" className="lg:mt-5">Save payment</Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Paying more than the due is kept as the customer&apos;s advance.</p>
            </form>

            <div className="card overflow-hidden">
              <h3 className="px-5 py-4 text-base font-bold text-navy-900">Purchase &amp; Due Ledger</h3>
              {!d.entries.length ? <EmptyState title="No ledger entries found yet" hint="Sales, payments and old dues will appear here." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead><tr><th className="th">Date</th><th className="th">Type</th><th className="th">Description</th><th className="th text-right">Quantity</th><th className="th text-right">Total</th><th className="th text-right">Paid / Received</th><th className="th text-right">Balance due</th><th className="th">Note</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {d.entries.map((e) => (
                        <tr key={e.id}>
                          <td className="td whitespace-nowrap">{formatDate(e.date)}</td>
                          <td className="td"><Badge tone={TYPE[e.type][1]}>{TYPE[e.type][0]}</Badge></td>
                          <td className="td">{e.description}</td>
                          <td className="td text-right">{e.qty || "—"}</td>
                          <td className="td text-right">{e.total ? formatMoney(e.total) : "—"}</td>
                          <td className="td text-right text-success">{e.received ? formatMoney(e.received) : "—"}</td>
                          <td className={`td text-right font-semibold ${e.balance > 0 ? "text-danger" : "text-success"}`}>{e.balance < 0 ? `${formatMoney(-e.balance)} adv.` : formatMoney(e.balance)}</td>
                          <td className="td text-slate-500">{e.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
