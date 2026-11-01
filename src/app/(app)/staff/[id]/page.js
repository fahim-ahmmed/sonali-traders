"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      <main className="space-y-5 p-5 sm:p-8">
        <Link href="/staff" className="inline-block text-xs font-semibold text-brand-600 hover:underline">← Staff List</Link>
        {!d ? <Skeleton className="h-40" /> : (
          <>
            <div className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-xl font-bold text-navy-900">{s.name}</h2><p className="text-sm text-slate-500">{s.designation || "Staff"} · {s.email}</p></div>
                <Link href={`/staff/${s.id}/edit`} className="rounded-lg bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100">Edit</Link>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-slate-500">Phone</dt><dd>{s.phone || "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Salary</dt><dd>{formatMoney(s.salary)}</dd></div>
                <div><dt className="text-xs text-slate-500">Address</dt><dd>{s.address || "—"}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.permissions.length ? s.permissions.map((k) => <Badge key={k} tone="info">{STAFF_PERMISSIONS.find((p) => p.key === k)?.label || k}</Badge>) : <span className="text-xs text-slate-500">No permissions</span>}
              </div>
            </div>
            <div className="card overflow-hidden">
              <h3 className="px-5 py-4 text-base font-bold text-navy-900">Submitted POS entries (latest 30)</h3>
              {!d.sales.length ? <EmptyState title="Nothing submitted yet" /> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[560px]">
                  <thead><tr><th className="th">Date</th><th className="th">Customer</th><th className="th text-right">Total</th><th className="th text-right">Paid</th><th className="th">Status</th><th className="th">Invoice</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{d.sales.map((x) => (
                    <tr key={x.id}><td className="td">{formatDate(x.date)}</td><td className="td">{x.customer}</td><td className="td text-right">{formatMoney(x.total)}</td><td className="td text-right">{formatMoney(x.paid)}</td>
                      <td className="td"><Badge tone={TONE[x.status]}>{x.status}</Badge></td><td className="td">{x.invoiceNo || "—"}</td></tr>))}</tbody></table></div>
              )}
            </div>
            <div className="card overflow-hidden">
              <h3 className="px-5 py-4 text-base font-bold text-navy-900">Expenses (latest 30)</h3>
              {!d.expenses.length ? <EmptyState title="No expenses recorded" /> : (
                <table className="w-full"><thead><tr><th className="th">Date</th><th className="th">Purpose</th><th className="th text-right">Amount</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{d.expenses.map((x) => <tr key={x.id}><td className="td">{formatDate(x.date)}</td><td className="td">{x.purpose}</td><td className="td text-right">{formatMoney(x.amount)}</td></tr>)}</tbody></table>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
