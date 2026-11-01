"use client";
import { useCallback, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PrintHeader from "@/components/layout/PrintHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

const CFG = {
  day: { group: "Report / Day Wise", title: "Day Wise Report", sub: "Sales, quantities, customer ledger and expenses for one business day." },
  month: { group: "Report / Month Wise", title: "Month Wise Report", sub: "Sales, old dues and expenses for one month." },
  manual: { group: "Report / Manual", title: "Manual Report", sub: "Pick any date range for a custom report." },
};

export default function ReportScreen({ kind }) {
  const { toast } = useToast();
  const today = dhakaDateKey();
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [range, setRange] = useState({ from: `${today.slice(0, 8)}01`, to: today });
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(false);

  const url = kind === "day" ? `/api/reports/day?date=${day}` : kind === "month" ? `/api/reports/month?month=${month}` : `/api/reports/manual?from=${range.from}&to=${range.to}`;
  const load = useCallback(async () => {
    setLoading(true);
    const j = await fetch(url).then((r) => r.json());
    setLoading(false);
    j.ok ? setD(j.data) : toast(j.error, "error");
  }, [url, toast]);
  useEffect(() => { load(); }, [load]); // তারিখ বদলালেই স্বয়ংক্রিয় রিফ্রেশ

  const c = CFG[kind];
  const t = d?.totals;
  const label = d ? (d.from === d.to ? formatDate(`${d.from}T00:00:00+06:00`, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : `${formatDate(`${d.from}T00:00:00+06:00`)} – ${formatDate(`${d.to}T00:00:00+06:00`)}`) : "";
  const cards = t && [
    ["Total Sale", formatMoney(t.sale), "border-t-brand-600"], ["Total Purchase", formatMoney(t.purchase), "border-t-gold-500"],
    ["Cement Quantity", `${t.cementQty} pcs`, "border-t-success"], ["Rod Quantity", `${t.rodQty} pcs`, "border-t-purple-500"], ["Total Expense", formatMoney(t.expense), "border-t-danger"],
  ];

  return (
    <>
      <PageHeader group={c.group} title="Reports" />
      <main className="p-5 sm:p-8">
        <PrintHeader title={c.title} subtitle={label} />
        <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-xl font-bold text-navy-900">{c.title}</h2><p className="text-sm text-slate-500">{c.sub}</p></div>
          <div className="flex flex-wrap items-end gap-3">
            {kind === "day" && <Input label="Date" type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />}
            {kind === "month" && <Input label="Month" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />}
            {kind === "manual" && (<><Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /><Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></>)}
            <Button variant="ghost" loading={loading} onClick={load}>View Report</Button>
            <Button onClick={() => window.print()} disabled={!d}><Printer className="h-4 w-4" /> Print Report</Button>
          </div>
        </div>

        {!d ? <div className="grid gap-3 sm:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div> : (
          <>
            <p className="mb-3 text-sm font-semibold text-slate-600">Report for {label}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map(([l, v, b]) => <div key={l} className={`card border-t-4 p-4 ${b}`}><p className="text-[11px] font-semibold uppercase text-slate-500">{l}</p><p className="text-xl font-bold text-navy-900">{v}</p></div>)}
            </div>

            <div className="card mt-5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"><h3 className="text-base font-bold text-navy-900">Customer Sales</h3><span className="text-xs text-slate-500">{d.sales.length} transaction(s)</span></div>
              {!d.sales.length && !d.opening.length ? <EmptyState title="No sales found for this period" /> : (
                <div className="max-h-[60vh] overflow-auto">
                  <table className="w-full min-w-[760px]">
                    <thead><tr><th className="th">Date</th><th className="th">Customer</th><th className="th">Product</th><th className="th text-right">Quantity</th><th className="th text-right">Total</th><th className="th text-right">Paid</th><th className="th text-right">Due</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {d.sales.map((s) => (
                        <tr key={s.id}>
                          <td className="td whitespace-nowrap">{formatDate(s.date)}</td><td className="td font-semibold">{s.customer}</td><td className="td">{s.product}</td>
                          <td className="td text-right">{s.qty ? `${s.qty} pcs` : "—"}</td><td className="td text-right">{formatMoney(s.total)}</td>
                          <td className="td text-right text-success">{formatMoney(s.paid)}</td><td className={`td text-right font-semibold ${s.due > 0 ? "text-danger" : "text-slate-400"}`}>{formatMoney(s.due)}</td>
                        </tr>
                      ))}
                      {d.opening.map((o) => (
                        <tr key={o.id} className="bg-slate-50 text-slate-500">
                          <td className="td whitespace-nowrap">{formatDate(o.date)}</td><td className="td font-semibold">{o.customer}</td><td className="td">Opening Due <span className="text-[11px]">(not counted in sales)</span></td>
                          <td className="td text-right">1 entry</td><td className="td text-right">{formatMoney(o.amount)}</td><td className="td text-right">{formatMoney(0)}</td><td className="td text-right">{formatMoney(o.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card mt-5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4"><h3 className="text-base font-bold text-navy-900">Expenses</h3><span className="text-xs text-slate-500">{d.expenses.length} expense(s)</span></div>
              {!d.expenses.length ? <EmptyState title="No expenses found for this period" /> : (
                <table className="w-full min-w-[560px]">
                  <thead><tr><th className="th">Date</th><th className="th">Paid by</th><th className="th">Expense for</th><th className="th">Note</th><th className="th text-right">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {d.expenses.map((e) => <tr key={e.id}><td className="td whitespace-nowrap">{formatDate(e.date)}</td><td className="td">{e.paidBy}</td><td className="td">{e.purpose}</td><td className="td text-slate-500">{e.note || "—"}</td><td className="td text-right">{formatMoney(e.amount)}</td></tr>)}
                  </tbody>
                  <tfoot><tr className="bg-slate-50"><td className="td font-bold" colSpan={4}>Total</td><td className="td text-right font-bold">{formatMoney(t.expense)}</td></tr></tfoot>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
