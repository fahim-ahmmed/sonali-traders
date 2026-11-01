"use client";
import { useCallback, useEffect, useState } from "react";
import { Boxes, CalendarRange, Hammer, Printer, ReceiptText, RefreshCw, ShoppingBasket, TrendingUp, Wallet } from "lucide-react";
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
    { l: "Total Sale", v: formatMoney(t.sale), icon: TrendingUp, grad: "from-sky-500 to-blue-600" },
    { l: "Total Purchase", v: formatMoney(t.purchase), icon: ShoppingBasket, grad: "from-emerald-500 to-green-600" },
    { l: "Cement Quantity", v: `${t.cementQty} PCS`, icon: Boxes, grad: "from-violet-500 to-purple-700" },
    { l: "Rod Quantity", v: `${t.rodQty} PCS`, icon: Hammer, grad: "from-blue-500 to-indigo-600" },
    { l: "Total Expense", v: formatMoney(t.expense), icon: Wallet, grad: "from-orange-400 to-amber-600" },
  ];

  return (
    <>
      <PageHeader group={c.group} title="Reports" />
      <main className="page">
        <PrintHeader title={c.title} subtitle={label} />
        <div className="no-print">
          <h2 className="page-title">{c.title}</h2>
          <p className="page-subtitle">{c.sub}</p>
        </div>

        <section className="card no-print flex flex-wrap items-end gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center self-end rounded-xl bg-brand-50 text-brand-600"><CalendarRange className="h-5 w-5" aria-hidden /></span>
          {kind === "day" && <Input label="Date" type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />}
          {kind === "month" && <Input label="Month" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />}
          {kind === "manual" && (<><Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /><Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></>)}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="ghost" loading={loading} onClick={load}>{!loading && <RefreshCw className="h-4 w-4" aria-hidden />} View Report</Button>
            <Button onClick={() => window.print()} disabled={!d}><Printer className="h-4 w-4" aria-hidden /> Print Report</Button>
          </div>
        </section>

        {!d ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div> : (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden /> Report for <span className="text-navy-900">{label}</span>
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map(({ l, v, icon: Icon, grad }) => (
                <div key={l} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-4 text-white shadow-lg shadow-navy-900/10`}>
                  <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10" aria-hidden />
                  <div className="relative flex items-center justify-between">
                    <p className="text-xs font-medium text-white/90">{l}</p>
                    <span className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm"><Icon className="h-4 w-4" aria-hidden /></span>
                  </div>
                  <p className="num relative mt-2 text-xl font-bold">{v}</p>
                </div>
              ))}
            </div>

            <section className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title text-base">Customer Sales</h3>
                <span className="badge badge-neutral num">{d.sales.length} transaction(s)</span>
              </div>
              {!d.sales.length && !d.opening.length ? <EmptyState icon={TrendingUp} title="No sales found for this period" /> : (
                <div className="table-wrap print-expand max-h-[60vh]">
                  <table className="w-full min-w-[820px]">
                    <thead><tr><th className="th">Date</th><th className="th">Customer</th><th className="th">Product</th><th className="th text-right">Quantity</th><th className="th text-right">Total</th><th className="th text-right">Paid</th><th className="th text-right">Due</th></tr></thead>
                    <tbody className="rows">
                      {d.sales.map((s) => (
                        <tr key={s.id}>
                          <td className="td num whitespace-nowrap text-slate-500">{formatDate(s.date)}</td>
                          <td className="td font-semibold text-navy-900">{s.customer}</td>
                          <td className="td">{s.product}</td>
                          <td className="td num text-right">{s.qty ? `${s.qty} pcs` : "—"}</td>
                          <td className="td num text-right font-medium text-navy-900">{formatMoney(s.total)}</td>
                          <td className="td num text-right text-emerald-600">{formatMoney(s.paid)}</td>
                          <td className={`td num text-right font-semibold ${s.due > 0 ? "text-rose-600" : "text-slate-400"}`}>{formatMoney(s.due)}</td>
                        </tr>
                      ))}
                      {d.opening.map((o) => (
                        <tr key={o.id} className="bg-amber-50/40 text-slate-500">
                          <td className="td num whitespace-nowrap">{formatDate(o.date)}</td>
                          <td className="td font-semibold text-slate-700">{o.customer}</td>
                          <td className="td"><span className="badge badge-warning">Opening Due</span> <span className="text-[11px]">(not counted in sales)</span></td>
                          <td className="td text-right">1 entry</td>
                          <td className="td num text-right">{formatMoney(o.amount)}</td>
                          <td className="td num text-right">{formatMoney(0)}</td>
                          <td className="td num text-right text-rose-600">{formatMoney(o.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title text-base">Expenses</h3>
                <span className="badge badge-neutral num">{d.expenses.length} expense(s)</span>
              </div>
              {!d.expenses.length ? <EmptyState icon={ReceiptText} title="No expenses found for this period" /> : (
                <div className="table-wrap print-expand max-h-[50vh]">
                  <table className="w-full min-w-[620px]">
                    <thead><tr><th className="th">Date</th><th className="th">Paid By</th><th className="th">Expense For</th><th className="th">Note</th><th className="th text-right">Amount</th></tr></thead>
                    <tbody className="rows">
                      {d.expenses.map((e) => (
                        <tr key={e.id}>
                          <td className="td num whitespace-nowrap text-slate-500">{formatDate(e.date)}</td>
                          <td className="td">{e.paidBy}</td>
                          <td className="td font-medium text-navy-900">{e.purpose}</td>
                          <td className="td text-slate-500">{e.note || "—"}</td>
                          <td className="td num text-right font-medium">{formatMoney(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-slate-50"><td className="td font-semibold text-navy-900" colSpan={4}>Total</td><td className="td num text-right font-bold text-navy-900">{formatMoney(t.expense)}</td></tr></tfoot>
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
