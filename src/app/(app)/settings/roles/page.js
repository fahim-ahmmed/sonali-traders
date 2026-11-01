"use client";
import { useEffect, useState } from "react";
import { Check, Lock, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { STAFF_PERMISSIONS } from "@/lib/permissions";

const DESC = {
  pos: "/pos — submit sales and collections (staff entries wait for approval)",
  purchase: "/purchases — record supplier purchases",
  supplier: "/suppliers — manage suppliers",
  product: "/products — products, categories and ledger",
  customer_list: "/customers — customer list, ledger and due payments",
  expenses: "/expenses — add their own expenses",
};
const ADMIN_ONLY = ["Reports", "Accounts", "Staff", "Settings", "Approvals", "Subscription"];

export default function RolePermissionPage() {
  const { toast } = useToast();
  const [sel, setSel] = useState(null);
  const [applyAll, setApplyAll] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/settings/roles").then((r) => r.json()).then((j) => j.ok ? setSel(j.data.staffDefault) : toast(j.error, "error")); }, [toast]);
  const toggle = (k) => setSel(sel.includes(k) ? sel.filter((x) => x !== k) : [...sel, k]);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings/roles", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffDefault: sel, applyToAll: applyAll }) }).then((r) => r.json());
    setSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast(applyAll ? `Saved. Updated ${res.data.updated} staff account(s).` : "Default staff permissions saved");
    setApplyAll(false);
  }

  return (
    <>
      <PageHeader group="Settings / Role Permission" title="Access control" />
      <main className="page">
        <div>
          <h2 className="page-title">Role Permission</h2>
          <p className="page-subtitle">Choose what a new staff account can open by default. You can still change each person when creating or editing them.</p>
        </div>
        <section className="card max-w-4xl overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-inset ring-brand-600/10"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
              <div>
                <h3 className="text-base font-semibold text-navy-900">Permission Matrix</h3>
                <p className="mt-0.5 text-xs text-slate-500">Click a switch in the Staff column to allow or block a page.</p>
              </div>
            </div>
            {sel && <span className="badge badge-info num">{sel.length} / {STAFF_PERMISSIONS.length} allowed</span>}
          </div>
          {!sel ? <div className="space-y-2 p-6"><Skeleton className="h-10" /><Skeleton className="h-10" /></div> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead><tr><th className="th">Permission</th><th className="th">What it opens</th><th className="th text-center">Admin</th><th className="th text-center">Staff Default</th></tr></thead>
                  <tbody className="rows">
                    {STAFF_PERMISSIONS.map((p) => {
                      const on = sel.includes(p.key);
                      return (
                        <tr key={p.key}>
                          <td className="td font-semibold text-navy-900">{p.label}</td>
                          <td className="td text-xs text-slate-500">{DESC[p.key]}</td>
                          <td className="td text-center"><span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-3.5 w-3.5" aria-label="Allowed" /></span></td>
                          <td className="td text-center">
                            <button type="button" role="switch" aria-checked={on} aria-label={`Staff default: ${p.label}`} onClick={() => toggle(p.key)}
                              className={`relative mx-auto inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${on ? "bg-brand-600" : "bg-slate-200"}`}>
                              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {ADMIN_ONLY.map((n) => (
                      <tr key={n} className="bg-slate-50/70">
                        <td className="td font-semibold text-slate-600">{n}</td>
                        <td className="td text-xs text-slate-500">Administrators only — can&apos;t be granted to staff</td>
                        <td className="td text-center"><span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-3.5 w-3.5" aria-label="Allowed" /></span></td>
                        <td className="td text-center"><span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-400"><Lock className="h-3.5 w-3.5" aria-label="Locked" /></span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="h-4 w-4 rounded accent-brand-600" /> Also apply to all existing staff</label>
                <Button loading={saving} onClick={save}>Save permissions</Button>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
