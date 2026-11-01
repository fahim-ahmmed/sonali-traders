"use client";
import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
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
      <main className="p-5 sm:p-8">
        <div className="card max-w-3xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-navy-900">Role Permission</h2>
            <p className="text-sm text-slate-500">Choose what a new staff account can open by default. You can still change each person when creating or editing them.</p>
          </div>
          {!sel ? <div className="space-y-2 p-6"><Skeleton className="h-10" /><Skeleton className="h-10" /></div> : (
            <>
              <table className="w-full">
                <thead><tr><th className="th">Permission</th><th className="th">What it opens</th><th className="th text-center">Admin</th><th className="th text-center">Staff default</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {STAFF_PERMISSIONS.map((p) => (
                    <tr key={p.key}>
                      <td className="td font-semibold">{p.label}</td><td className="td text-xs text-slate-500">{DESC[p.key]}</td>
                      <td className="td text-center"><Check className="mx-auto h-4 w-4 text-success" aria-label="Allowed" /></td>
                      <td className="td text-center"><input type="checkbox" checked={sel.includes(p.key)} onChange={() => toggle(p.key)} className="h-4 w-4 accent-brand-600" aria-label={`Staff default: ${p.label}`} /></td>
                    </tr>
                  ))}
                  {ADMIN_ONLY.map((n) => (
                    <tr key={n} className="bg-slate-50"><td className="td font-semibold">{n}</td><td className="td text-xs text-slate-500">Administrators only — can't be granted to staff</td>
                      <td className="td text-center"><Check className="mx-auto h-4 w-4 text-success" /></td><td className="td text-center"><Lock className="mx-auto h-4 w-4 text-slate-400" aria-label="Locked" /></td></tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-5">
                <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="h-4 w-4 accent-brand-600" /> Also apply to all existing staff</label>
                <Button loading={saving} onClick={save}>Save permissions</Button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
