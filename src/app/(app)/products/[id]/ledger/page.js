"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, History, Package } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/dates";

const TYPE = { purchase: ["Purchase", "success"], sale: ["Sale", "info"], adjust: ["Adjust", "warning"] };

export default function ProductLedgerPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [d, setD] = useState(null);

  useEffect(() => {
    fetch(`/api/products/${id}/ledger`).then((r) => r.json()).then((j) => j.ok ? setD(j.data) : toast(j.error, "error"));
  }, [id, toast]);

  return (
    <>
      <PageHeader group="Product / Ledger" title="Product management" />
      <main className="page">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Product List
        </Link>
        {!d ? (
          <div className="space-y-4"><Skeleton className="h-20 rounded-2xl" /><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div><Skeleton className="h-64 rounded-2xl" /></div>
        ) : (
          <>
            <section className="card flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 text-white shadow-lg shadow-navy-900/20"><Package className="h-5 w-5" aria-hidden /></span>
              <div>
                <h2 className="page-title">{d.product.name}</h2>
                <p className="page-subtitle">{d.product.brand} · Stock movement ledger</p>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { l: "Current Stock", v: d.product.stock, icon: Package, tone: d.product.stock < 0 ? "text-rose-600" : "text-navy-900", ring: "bg-brand-50 text-brand-600" },
                { l: "Total In (Purchases)", v: d.totalIn, icon: ArrowDownToLine, tone: "text-emerald-600", ring: "bg-emerald-50 text-emerald-600" },
                { l: "Total Out (Sales)", v: d.totalOut, icon: ArrowUpFromLine, tone: "text-rose-600", ring: "bg-rose-50 text-rose-600" },
              ].map(({ l, v, icon: Icon, tone, ring }) => (
                <div key={l} className="card p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{l}</p>
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${ring}`}><Icon className="h-4 w-4" aria-hidden /></span>
                  </div>
                  <p className={`num mt-2 text-2xl font-bold ${tone}`}>{v}</p>
                </div>
              ))}
            </div>

            <section className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title text-base">Stock Movement</h3>
                <span className="badge badge-neutral num">{d.rows.length} entries</span>
              </div>
              {!d.rows.length ? <EmptyState icon={History} title="No stock movement yet" hint="Purchases add stock and approved sales reduce it. They will appear here." /> : (
                <div className="table-wrap max-h-[65vh]">
                  <table className="w-full min-w-[560px]">
                    <thead><tr><th className="th">Date</th><th className="th">Type</th><th className="th text-right">Quantity</th><th className="th text-right">Stock After</th><th className="th">Note</th></tr></thead>
                    <tbody className="rows">
                      {d.rows.map((r) => (
                        <tr key={r.id}>
                          <td className="td num text-slate-500">{formatDate(r.date)}</td>
                          <td className="td"><Badge tone={TYPE[r.type][1]}>{TYPE[r.type][0]}</Badge></td>
                          <td className={`td num text-right font-semibold ${r.qty > 0 ? "text-emerald-600" : "text-rose-600"}`}>{r.qty > 0 ? `+${r.qty}` : r.qty}</td>
                          <td className="td num text-right font-medium text-navy-900">{r.balance}</td>
                          <td className="td text-slate-500">{r.note || "—"}</td>
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
