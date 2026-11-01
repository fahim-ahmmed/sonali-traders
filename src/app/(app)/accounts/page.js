"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarRange, CircleDollarSign, Coins, Landmark, Printer, ReceiptText, RefreshCw, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PrintHeader from "@/components/layout/PrintHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey, formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

const monthStart = () => `${dhakaDateKey().slice(0, 8)}01`;

export default function AccountsPage() {
  const { toast } = useToast();
  const [range, setRange] = useState({ from: monthStart(), to: dhakaDateKey() });
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (r) => {
    setLoading(true);
    const j = await fetch(`/api/accounts?from=${r.from}&to=${r.to}`).then((x) => x.json());
    setLoading(false);
    j.ok ? setD(j.data) : toast(j.error, "error");
  }, [toast]);
  useEffect(() => { load(range); }, [range, load]);

  const t = d?.totals;
  // ঋণাত্মক মান মাইনাস চিহ্ন দিয়ে নয় — "Loss" লেবেল ও লাল রঙে
  const cards = t && [
    { l: "Total Sales", v: t.sales, icon: TrendingUp, tone: "text-navy-900", ring: "bg-brand-50 text-brand-600", bar: "bg-brand-600" },
    { l: "Total Cost", v: t.cost, icon: Coins, tone: "text-navy-900", ring: "bg-amber-50 text-gold-600", bar: "bg-gold-500" },
    t.profit >= 0
      ? { l: "Total Profit", v: t.profit, icon: CircleDollarSign, tone: "text-emerald-600", ring: "bg-emerald-50 text-emerald-600", bar: "bg-success" }
      : { l: "Total Loss", v: -t.profit, icon: TrendingDown, tone: "text-rose-600", ring: "bg-rose-50 text-rose-600", bar: "bg-danger" },
    t.netProfit >= 0
      ? { l: "Net Profit", hint: "Profit − Expense", v: t.netProfit, icon: Landmark, tone: "text-emerald-600", ring: "bg-emerald-50 text-emerald-600", bar: "bg-success" }
      : { l: "Net Loss", hint: "Profit − Expense", v: -t.netProfit, icon: TrendingDown, tone: "text-rose-600", ring: "bg-rose-50 text-rose-600", bar: "bg-danger" },
    { l: "Total Due", hint: "On these sales", v: t.due, icon: ReceiptText, tone: t.due > 0 ? "text-rose-600" : "text-slate-400", ring: "bg-rose-50 text-rose-600", bar: "bg-danger" },
    { l: "Total Expense", v: t.expense, icon: Wallet, tone: "text-navy-900", ring: "bg-orange-50 text-orange-600", bar: "bg-orange-500" },
  ];

  return (
    <>
      <PageHeader group="Accounts" title="Sales, profit & due" />
      <main className="page">
        <PrintHeader title="Accounts report" subtitle={d ? `${formatDate(`${d.from}T00:00:00+06:00`)} – ${formatDate(`${d.to}T00:00:00+06:00`)}` : ""} />
        <div className="no-print">
          <h2 className="page-title">Accounts</h2>
          <p className="page-subtitle">Sales, profit and due balance for the selected period.</p>
        </div>

        <section className="card no-print flex flex-wrap items-end gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center self-end rounded-xl bg-brand-50 text-brand-600"><CalendarRange className="h-5 w-5" aria-hidden /></span>
          <Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
          <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="ghost" loading={loading} onClick={() => load(range)}>{!loading && <RefreshCw className="h-4 w-4" aria-hidden />} View Accounts</Button>
            <Button onClick={() => window.print()} disabled={!d}><Printer className="h-4 w-4" aria-hidden /> Print</Button>
          </div>
        </section>

        {!d ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div> : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(({ l, hint, v, icon: Icon, tone, ring, bar }) => (
                <div key={l} className="card relative overflow-hidden p-5">
                  <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} aria-hidden />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{l}</p>
                      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
                    </div>
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${ring}`}><Icon className="h-4 w-4" aria-hidden /></span>
                  </div>
                  <p className={`num mt-2 text-2xl font-bold ${tone}`}>{formatMoney(v)}</p>
                </div>
              ))}
            </div>
            <p className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100/70 px-4 py-3 text-xs text-slate-600">
              <ReceiptText className="h-4 w-4 text-slate-400" aria-hidden />
              Receivable from all customers right now: <b className="num text-rose-600">{formatMoney(d.receivable.amount)}</b>
              <span className="num">({d.receivable.customers} customers)</span> — includes old dues and is separate from profit.
            </p>

            <section className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title text-base">Sale Details</h3>
                <span className="badge badge-neutral num">{d.rows.length} invoice(s)</span>
              </div>
              {!d.rows.length ? <EmptyState icon={ReceiptText} title="No approved sales in this period" /> : (
                <div className="table-wrap print-expand max-h-[65vh]">
                  <table className="w-full min-w-[780px]">
                    <thead><tr><th className="th">Invoice</th><th className="th">Date</th><th className="th">Customer</th><th className="th text-right">Sales</th><th className="th text-right">Cost</th><th className="th text-right">Profit</th><th className="th text-right">Due</th></tr></thead>
                    <tbody className="rows">
                      {d.rows.map((r) => (
                        <tr key={r.id}>
                          <td className="td"><span className="badge badge-info num">{r.invoiceNo}</span></td>
                          <td className="td num whitespace-nowrap text-slate-500">{formatDate(r.date)}</td>
                          <td className="td font-medium text-navy-900">{r.customer}</td>
                          <td className="td num text-right">{formatMoney(r.sales)}</td>
                          <td className="td num text-right text-slate-500">{formatMoney(r.cost)}</td>
                          <td className={`td num text-right font-semibold ${r.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatMoney(r.profit)}</td>
                          <td className="td text-right">{r.due > 0 ? <span className="badge badge-danger num">{formatMoney(r.due)}</span> : <span className="num text-slate-400">{formatMoney(0)}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
