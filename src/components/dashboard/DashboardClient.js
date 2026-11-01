"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Banknote, Boxes, CalendarCheck, CalendarClock, CircleDollarSign, HandCoins,
  Hammer, PackageCheck, Search, ShoppingBag, Truck, Wallet,
} from "lucide-react";
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
  { k: "todaySale", label: "Today's Sale", icon: ArrowUpRight, grad: "from-sky-500 to-blue-600", glow: "shadow-blue-600/20", href: "/reports/day-wise", fmt: money,
    sub: (d) => d.saleChangePct === null ? "No sales yesterday to compare" : `${d.saleChangePct >= 0 ? "+" : ""}${d.saleChangePct}% vs yesterday` },
  { k: "todayPurchase", label: "Today's Purchase", icon: PackageCheck, grad: "from-emerald-500 to-green-600", glow: "shadow-green-600/20", href: "/purchases", fmt: money, sub: () => "Supplier purchases today" },
  { k: "receivableDue", label: "Receivable Due", icon: CircleDollarSign, grad: "from-amber-400 to-yellow-600", glow: "shadow-yellow-600/20", href: "/customers?due=1", fmt: money, sub: (d) => `${d.dueCustomerCount} customers with due` },
  { k: "todayDueCollection", label: "Today's Due Collection", icon: HandCoins, grad: "from-purple-500 to-indigo-600", glow: "shadow-indigo-600/20", href: "/reports/day-wise", fmt: money, sub: () => "Old dues received today" },
  { k: "totalCollection", label: "Total Collection", icon: Banknote, grad: "from-teal-500 to-emerald-600", glow: "shadow-emerald-600/20", href: "/reports/day-wise", fmt: money, sub: () => "All money received today" },
  { k: "supplierDue", label: "Supplier Due", icon: Truck, grad: "from-orange-500 to-red-600", glow: "shadow-red-600/20", href: "/purchases", fmt: money, sub: () => "Purchase balance still unpaid" },
  { k: "todayRodSale", label: "Today's Rod Sale", icon: Hammer, grad: "from-blue-500 to-indigo-600", glow: "shadow-indigo-600/20", href: "/reports/day-wise", fmt: pcs, sub: () => "Rod quantity sold today" },
  { k: "todayCementSale", label: "Today's Cement Sale", icon: Boxes, grad: "from-violet-500 to-purple-700", glow: "shadow-purple-700/20", href: "/reports/day-wise", fmt: pcs, sub: () => "Cement quantity sold today" },
  { k: "todayExpense", label: "Today's Expense", icon: Wallet, grad: "from-orange-400 to-amber-600", glow: "shadow-amber-600/20", href: "/expenses", fmt: money, sub: () => "Business expenses today" },
];

const SUB_STYLE = {
  active: { bar: "bg-success", badge: "badge badge-success", label: "Active" },
  expiring: { bar: "bg-warning", badge: "badge badge-warning", label: "Expiring soon" },
  expired: { bar: "bg-danger", badge: "badge badge-danger", label: "Expired" },
  unknown: { bar: "bg-slate-300", badge: "badge badge-neutral", label: "Not set" },
};

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function SubscriptionCard({ sub }) {
  if (!sub) return <p className="text-sm text-slate-500">Subscription details have not been set up yet.</p>;
  const s = SUB_STYLE[sub.state] || SUB_STYLE.unknown;
  const rows = [
    { l: "Monthly Fee", v: formatMoney(sub.monthlyFee), icon: Wallet, accent: "bg-brand-600", num: true },
    { l: "Valid Until", v: formatDate(sub.validUntil), icon: CalendarCheck, accent: s.bar },
    { l: "Next Payment Date", v: formatDate(sub.nextPaymentDate), icon: CalendarClock, accent: "bg-gold-500" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
        <span className="text-xs font-medium text-slate-500">Plan status</span>
        <span className={s.badge}>
          {s.label}
          {sub.days !== null && sub.state !== "expired" ? ` · ${sub.days} day${sub.days === 1 ? "" : "s"} left` : ""}
        </span>
      </div>
      {rows.map(({ l, v, icon: Icon, accent, num }) => (
        <div key={l} className="relative flex items-center gap-4 overflow-hidden rounded-xl border border-slate-100 bg-white px-4 py-3.5">
          <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} aria-hidden />
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon className="h-4 w-4" aria-hidden /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{l}</p>
            <p className={`text-lg font-bold text-navy-900 ${num ? "num" : ""}`}>{v}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DueCustomers({ initial }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState(initial);
  const first = useRef(true);

  useEffect(() => { setData(initial); }, [initial]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(async () => {
      const j = await fetch(`/api/customers?due=1&sort=due&limit=15${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`).then((r) => r.json()).catch(() => null);
      if (j?.ok) setData(j.data);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <section className="card flex flex-col overflow-hidden" aria-label="Due customers">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <h3 className="card-title text-base">Due Customer</h3>
          {data && <span className="badge badge-danger num">{data.total}</span>}
        </div>
        <Link href="/customers?due=1" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
          View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="px-5 pt-4">
        <label className="relative block">
          <span className="sr-only">Search due customers</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quick search by name or phone…" className="field pl-10" />
        </label>
      </div>
      <div className="max-h-[420px] flex-1 overflow-y-auto px-3 py-3">
        {!data ? (
          <div className="space-y-2 px-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !data.items.length ? (
          <p className="py-10 text-center text-sm text-slate-500">{q ? "No due customer matches your search." : "Nobody owes money right now."}</p>
        ) : (
          <ul className="space-y-1">
            {data.items.map((c, i) => (
              <li key={c.id}>
                <Link href={`/customers/${c.id}`} className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50">
                  <span className="num w-5 shrink-0 text-center text-xs font-semibold text-slate-400">{i + 1}</span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 ring-1 ring-inset ring-rose-600/10">
                    {(c.name || "?").slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy-900 group-hover:text-brand-600">{c.name}</span>
                    {c.phone && <span className="num block text-xs text-slate-500">{c.phone}</span>}
                  </span>
                  <span className="badge badge-danger num">{formatMoney(c.due)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
        fetch("/api/customers?due=1&sort=due&limit=15").then((r) => r.json()),
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
      <PageHeader group="Workspace overview" title={`${greeting()}, ${company}`} />
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-title">Operations overview</h2>
            <p className="page-subtitle">Here is what is happening across your material flow today.</p>
          </div>
          <Link
            href="/pos"
            className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 px-5 py-3 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 backdrop-blur-sm"><ShoppingBag className="h-5 w-5" aria-hidden /></span>
            <span className="leading-tight"><b className="block text-sm">POS</b><span className="text-[11px] text-white/85">Sell products faster</span></span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        {err ? (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
            <p className="text-sm font-medium text-danger">Couldn&apos;t load today&apos;s numbers. Check your connection and try again.</p>
            <Button onClick={load}>Try again</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => {
              const Icon = c.icon;
              return d ? (
                <Link
                  key={c.k}
                  href={c.href}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br ${c.grad} p-5 text-white shadow-lg ${c.glow} transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
                >
                  <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-110" aria-hidden />
                  <span className="pointer-events-none absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/[.07]" aria-hidden />
                  <div className="relative flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white/90">{c.label}</p>
                    <span className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm"><Icon className="h-5 w-5" aria-hidden /></span>
                  </div>
                  <p className="num relative mt-2 text-[28px] font-bold leading-tight tracking-tight"><CountUp value={d[c.k]} format={c.fmt} /></p>
                  <p className="relative mt-1.5 text-xs text-white/80">{c.sub(d)}</p>
                </Link>
              ) : <Skeleton key={c.k} className="h-[136px] rounded-2xl" />;
            })}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card overflow-hidden" aria-label="Subscription">
            <div className="card-header">
              <h3 className="card-title text-base">Subscription</h3>
              <Link href="/subscription" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Details <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <div className="p-5">{sub === undefined ? <Skeleton className="h-56" /> : <SubscriptionCard sub={sub} />}</div>
          </section>
          <DueCustomers initial={due} />
        </div>
      </main>
    </>
  );
}
