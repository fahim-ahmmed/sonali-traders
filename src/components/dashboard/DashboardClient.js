"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Banknote, Boxes, Check, CircleDollarSign, HandCoins, Hammer, ReceiptText, ShoppingBag, TrendingUp, Truck, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import CountUp from "@/components/ui/CountUp";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Feedback";
import { formatMoney } from "@/lib/money";
import { formatDate, TZ } from "@/lib/dates";

const money = (n) => formatMoney(Math.round(n));
const pcs = (n) => `${Math.round(n)} PCS`;

// ক্লাস নাম পূর্ণ লেখা (Tailwind purge-এর জন্য)
const CARDS = [
  { k: "todaySale", label: "Today's Sale", icon: ArrowUpRight, grad: "from-sky-500 to-blue-600", href: "/reports/day-wise", fmt: money,
    sub: (d) => d.saleChangePct === null ? "No sales yesterday to compare" : `${d.saleChangePct >= 0 ? "+" : ""}${d.saleChangePct}% vs yesterday` },
  { k: "todayPurchase", label: "Today's Purchase", icon: Check, grad: "from-emerald-500 to-green-600", href: "/purchases", fmt: money, sub: () => "Supplier purchases today" },
  { k: "receivableDue", label: "Receivable Due", icon: CircleDollarSign, grad: "from-amber-400 to-yellow-600", href: "/customers?due=1", fmt: money, sub: (d) => `${d.dueCustomerCount} customers with due` },
  { k: "todayDueCollection", label: "Today's Due Collection", icon: HandCoins, grad: "from-violet-500 to-purple-700", href: "/reports/day-wise", fmt: money, sub: () => "Old dues received today" },
  { k: "totalCollection", label: "Total Collection", icon: Banknote, grad: "from-teal-500 to-emerald-700", href: "/reports/day-wise", fmt: money, sub: () => "All money received today" },
  { k: "supplierDue", label: "Supplier Due", icon: Truck, grad: "from-orange-500 to-red-600", href: "/purchases", fmt: money, sub: () => "Purchase balance still unpaid" },
  { k: "todayRodSale", label: "Today's Rod Sale", icon: Hammer, grad: "from-blue-500 to-indigo-600", href: "/reports/day-wise", fmt: pcs, sub: () => "Sold today" },
  { k: "todayCementSale", label: "Today's Cement Sale", icon: Boxes, grad: "from-purple-500 to-fuchsia-700", href: "/reports/day-wise", fmt: pcs, sub: () => "Sold today" },
  { k: "todayExpense", label: "Today's Expense", icon: Wallet, grad: "from-orange-400 to-rose-600", href: "/expenses", fmt: money, sub: () => "Business expenses today" },
];

const SUB_STYLE = {
  active: ["border-l-success", "text-success", "Active"], expiring: ["border-l-warning", "text-amber-600", "Expiring soon"],
  expired: ["border-l-danger", "text-danger", "Expired"], unknown: ["border-l-slate-300", "text-slate-500", "Not set"],
};

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function SubscriptionCard({ sub }) {
  if (!sub) return <p className="text-sm text-slate-500">Subscription details have not been set up yet.</p>;
  const [border, text, label] = SUB_STYLE[sub.state];
  const rows = [["Monthly fee", formatMoney(sub.monthlyFee, { decimals: 0 })], ["Valid until", formatDate(sub.validUntil)], ["Next payment date", formatDate(sub.nextPaymentDate)]];
  return (
    <div className="space-y-3">
      {rows.map(([l, v], i) => (
        <div key={l} className={`rounded-lg border-l-4 bg-slate-50 px-4 py-3 ${i === 1 ? border : "border-l-brand-600"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{l}</p>
          <p className={`text-lg font-bold ${i === 1 ? text : "text-navy-900"}`}>{v}</p>
        </div>
      ))}
      <p className={`text-xs font-semibold ${text}`}>{label}{sub.days !== null && sub.state !== "expired" ? ` · ${sub.days} day${sub.days === 1 ? "" : "s"} left` : ""}</p>
    </div>
  );
}

export default function DashboardClient() {
  const [d, setD] = useState(null);
  const [due, setDue] = useState(null);
  const [sub, setSub] = useState(undefined);
  const [company, setCompany] = useState("Sonali Trading");
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setErr(false);
    try {
      const [a, b, c, s] = await Promise.all([
        fetch("/api/dashboard/summary").then((r) => r.json()),
        fetch("/api/customers?due=1&limit=10").then((r) => r.json()),
        fetch("/api/subscription").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
      ]);
      if (!a.ok) throw new Error(a.error);
      setD(a.data); if (b.ok) setDue(b.data); if (c.ok) setSub(c.data); if (s.ok && s.data?.companyName) setCompany(s.data.companyName);
    } catch { setErr(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader group="Workspace overview" title={`${greeting()}, ${company}`}>
        <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">{formatDate(new Date(), { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}</span>
      </PageHeader>
      <main className="space-y-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-navy-900">Operations overview</h2><p className="text-sm text-slate-500">Here is what is happening across your material flow today.</p></div>
          <Link href="/pos" className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 px-5 py-3 text-white shadow-card transition-transform duration-150 hover:-translate-y-0.5">
            <ShoppingBag className="h-5 w-5" aria-hidden /><span><b className="block text-sm">POS</b><span className="text-[11px] text-white/80">Sell products faster</span></span><ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {err ? (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-6"><p className="text-sm text-danger">Couldn&apos;t load today&apos;s numbers. Check your connection and try again.</p><Button onClick={load}>Try again</Button></div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {CARDS.map((c) => {
              const Icon = c.icon;
              return d ? (
                <Link key={c.k} href={c.href} className={`rounded-xl bg-gradient-to-br ${c.grad} p-5 text-white shadow-card transition duration-150 hover:-translate-y-0.5 hover:shadow-lg`}>
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold">{c.label}</p><span className="grid h-7 w-7 place-items-center rounded-md bg-white/25"><Icon className="h-4 w-4" aria-hidden /></span></div>
                  <p className="mt-3 text-2xl font-bold"><CountUp value={d[c.k]} format={c.fmt} /></p>
                  <p className="mt-1 text-[11px] text-white/80">{c.sub(d)}</p>
                </Link>
              ) : <Skeleton key={c.k} className="h-[118px] rounded-xl" />;
            })}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="card p-5" aria-label="Subscription">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-bold text-navy-900">Subscription</h3><Link href="/subscription" className="text-xs font-semibold text-brand-600 hover:underline">Details</Link></div>
            {sub === undefined ? <Skeleton className="h-40" /> : <SubscriptionCard sub={sub} />}
          </section>
          <section className="card p-5" aria-label="Due customers">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-base font-bold text-navy-900">Due Customer</h3>{due && due.total > 10 && <Link href="/customers?due=1" className="text-xs font-semibold text-brand-600 hover:underline">View all ({due.total})</Link>}</div>
            {!due ? <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
              : !due.items.length ? <p className="py-8 text-center text-sm text-slate-500">Nobody owes money right now.</p>
              : (
                <ul className="divide-y divide-slate-100">
                  {due.items.map((c) => (
                    <li key={c.id}><Link href={`/customers/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-600">
                      <span className="flex min-w-0 items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full bg-danger" /><span className="truncate">{c.name}</span></span>
                      <span className="shrink-0 font-semibold text-danger">{formatMoney(c.due, { decimals: 0 })}</span></Link></li>
                  ))}
                </ul>
              )}
            {due && due.total > 0 && <Link href="/customers?due=1" className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-slate-50 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50">View all due customers <ReceiptText className="h-3.5 w-3.5" /></Link>}
          </section>
        </div>
      </main>
    </>
  );
}
