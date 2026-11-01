"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Banknote, MapPin, Pencil, Phone, Receipt, ShieldCheck, ShoppingCart } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { STAFF_PERMISSIONS } from "@/lib/permissions";

const TONE = { pending: "warning", approved: "success", declined: "danger" };

export default function StaffProfilePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [d, setD] = useState(null);
  useEffect(() => { fetch(`/api/staff/${id}`).then((r) => r.json()).then((j) => j.ok ? setD(j.data) : toast(j.error, "error")); }, [id, toast]);
  const s = d?.staff;
  return (
    <>
      <PageHeader group="Staff / Profile" title="Team management" />
      <main className="page">
        <Link href="/staff" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Staff List
        </Link>
        {!d ? <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div> : (
          <>
            <section className="card overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-navy-900 via-navy-800 to-gold-500" aria-hidden />
              <div className="px-6 pb-6">
                <div className="-mt-9 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex items-end gap-4">
                    <span className="grid h-[72px] w-[72px] place-items-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-lg">
                      {(s.name || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="pb-1">
                      <h2 className="page-title">{s.name}</h2>
                      <p className="page-subtitle">{s.designation || "Staff"} · {s.email}</p>
                    </div>
                  </div>
                  <Link href={`/staff/${s.id}/edit`} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    <Pencil className="h-4 w-4" aria-hidden /> Edit
                  </Link>
                </div>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  {[["Phone", s.phone || "—", Phone, true], ["Salary", formatMoney(s.salary), Banknote, true], ["Address", s.address || "—", MapPin]].map(([l, v, Icon, num]) => (
                    <div key={l} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-slate-500 shadow-sm"><Icon className="h-4 w-4" aria-hidden /></span>
                      <div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{l}</dt><dd className={`truncate font-medium text-navy-900 ${num ? "num" : ""}`}>{v}</dd></div>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {s.permissions.length ? s.permissions.map((k) => <Badge key={k} tone="info">{STAFF_PERMISSIONS.find((p) => p.key === k)?.label || k}</Badge>) : <span className="text-xs text-slate-500">No permissions</span>}
                  </div>
                </div>
              </div>
            </section>

            <section className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title text-base">Submitted POS entries <span className="font-normal text-slate-400">(latest 30)</span></h3>
              </div>
              {!d.sales.length ? <EmptyState icon={ShoppingCart} title="Nothing submitted yet" /> : (
                <div className="table-wrap max-h-[60vh]"><table className="w-full min-w-[640px]">
                  <thead><tr><th className="th">Date</th><th className="th">Customer</th><th className="th text-right">Total</th><th className="th text-right">Paid</th><th className="th">Status</th><th className="th">Invoice</th></tr></thead>
                  <tbody className="rows">{d.sales.map((x) => (
                    <tr key={x.id}>
                      <td className="td num text-slate-500">{formatDate(x.date)}</td>
                      <td className="td font-medium text-navy-900">{x.customer}</td>
                      <td className="td num text-right">{formatMoney(x.total)}</td>
                      <td className="td num text-right text-emerald-600">{formatMoney(x.paid)}</td>
                      <td className="td"><Badge tone={TONE[x.status]}>{x.status}</Badge></td>
                      <td className="td num">{x.invoiceNo || "—"}</td>
                    </tr>))}</tbody></table></div>
              )}
            </section>
            <section className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title text-base">Expenses <span className="font-normal text-slate-400">(latest 30)</span></h3>
              </div>
              {!d.expenses.length ? <EmptyState icon={Receipt} title="No expenses recorded" /> : (
                <div className="table-wrap max-h-[50vh]"><table className="w-full">
                  <thead><tr><th className="th">Date</th><th className="th">Purpose</th><th className="th text-right">Amount</th></tr></thead>
                  <tbody className="rows">{d.expenses.map((x) => <tr key={x.id}><td className="td num text-slate-500">{formatDate(x.date)}</td><td className="td text-navy-900">{x.purpose}</td><td className="td num text-right font-medium">{formatMoney(x.amount)}</td></tr>)}</tbody></table></div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
