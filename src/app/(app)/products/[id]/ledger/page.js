"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      <main className="p-5 sm:p-8">
        <Link href="/products" className="mb-3 inline-block text-xs font-semibold text-brand-600 hover:underline">← Product List</Link>
        {!d ? <Skeleton className="h-40" /> : (
          <>
            <h2 className="text-xl font-bold text-navy-900">{d.product.name} <span className="text-sm font-medium text-slate-500">({d.product.brand})</span></h2>
            <div className="my-4 grid gap-3 sm:grid-cols-3">
              {[["Current stock", d.product.stock, "text-navy-900"], ["Total in (purchases)", d.totalIn, "text-success"], ["Total out (sales)", d.totalOut, "text-danger"]].map(([l, v, c]) => (
                <div key={l} className="card p-4"><p className="text-xs text-slate-500">{l}</p><p className={`text-2xl font-bold ${c}`}>{v}</p></div>
              ))}
            </div>
            <div className="card overflow-hidden">
              {!d.rows.length ? <EmptyState title="No stock movement yet" hint="Purchases add stock and approved sales reduce it. They will appear here." /> : (
                <div className="max-h-[65vh] overflow-auto">
                  <table className="w-full min-w-[520px]">
                    <thead><tr><th className="th">Date</th><th className="th">Type</th><th className="th text-right">Quantity</th><th className="th text-right">Stock after</th><th className="th">Note</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {d.rows.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="td">{formatDate(r.date)}</td>
                          <td className="td"><Badge tone={TYPE[r.type][1]}>{TYPE[r.type][0]}</Badge></td>
                          <td className={`td text-right font-semibold ${r.qty > 0 ? "text-success" : "text-danger"}`}>{r.qty > 0 ? `+${r.qty}` : r.qty}</td>
                          <td className="td text-right">{r.balance}</td>
                          <td className="td text-slate-500">{r.note || "—"}</td>
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
