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
  const cards = t && [
    ["Total Sales", t.sales, "border-t-brand-600", "text-navy-900"],
    ["Total Cost", t.cost, "border-t-gold-500", "text-navy-900"],
    ["Total Profit", t.profit, "border-t-success", "text-success"],
    ["Total Expense", t.expense, "border-t-danger", "text-danger"],
    ["Net Profit (Profit − Expense)", t.netProfit, "border-t-success", t.netProfit >= 0 ? "text-success" : "text-danger"],
    ["Total Due (these sales)", t.due, "border-t-danger", "text-danger"],
  ];

  return (
    <>
      <PageHeader group="Accounts" title="Sales, profit & due" />
      <main className="p-5 sm:p-8">
        <PrintHeader title="Accounts report" subtitle={d ? `${formatDate(`${d.from}T00:00:00+06:00`)} – ${formatDate(`${d.to}T00:00:00+06:00`)}` : ""} />
        <div className="no-print mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-xl font-bold text-navy-900">Accounts</h2><p className="text-sm text-slate-500">Sales, profit and due balance for the selected period.</p></div>
          <div className="flex flex-wrap items-end gap-3">
            <Input label="From" type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
            <Input label="To" type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
            <Button variant="ghost" loading={loading} onClick={() => load(range)}>View Accounts</Button>
            <Button onClick={() => window.print()} disabled={!d}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </div>

        {!d ? <div className="grid gap-3 sm:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div> : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(([l, v, b, c]) => (
                <div key={l} className={`card border-t-4 p-4 ${b}`}><p className="text-[11px] font-semibold uppercase text-slate-500">{l}</p><p className={`text-2xl font-bold ${c}`}>{formatMoney(v)}</p></div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Receivable from all customers right now: <b className="text-slate-700">{formatMoney(d.receivable.amount)}</b> ({d.receivable.customers} customers). This includes old dues and is separate from profit.</p>

            <div className="card mt-5 overflow-hidden">
              <h3 className="px-5 py-4 text-base font-bold text-navy-900">Sale Details</h3>
              {!d.rows.length ? <EmptyState title="No approved sales in this period" /> : (
                <div className="max-h-[65vh] overflow-auto">
                  <table className="w-full min-w-[720px]">
                    <thead><tr><th className="th">Invoice</th><th className="th">Date</th><th className="th">Customer</th><th className="th text-right">Sales</th><th className="th text-right">Cost</th><th className="th text-right">Profit</th><th className="th text-right">Due</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {d.rows.map((r) => (
                        <tr key={r.id}>
                          <td className="td font-semibold">{r.invoiceNo}</td><td className="td whitespace-nowrap">{formatDate(r.date)}</td><td className="td">{r.customer}</td>
                          <td className="td text-right">{formatMoney(r.sales)}</td><td className="td text-right">{formatMoney(r.cost)}</td>
                          <td className={`td text-right font-semibold ${r.profit >= 0 ? "text-success" : "text-danger"}`}>{formatMoney(r.profit)}</td>
                          <td className={`td text-right font-semibold ${r.due > 0 ? "text-danger" : "text-slate-400"}`}>{formatMoney(r.due)}</td>
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
