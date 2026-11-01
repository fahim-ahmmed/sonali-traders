"use client";
import { Check } from "lucide-react";
import { STAFF_PERMISSIONS } from "@/lib/permissions";

const GROUPS = ["Sales", "Inventory", "People"];

export default function PermissionPicker({ value, onChange }) {
  const set = new Set(value);
  const toggle = (k) => { const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); onChange([...n]); };
  const all = STAFF_PERMISSIONS.every((p) => set.has(p.key));
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-navy-900">Staff permissions</span>
          <p className="text-xs text-slate-500"><span className="num">{set.size}</span> of <span className="num">{STAFF_PERMISSIONS.length}</span> pages allowed</p>
        </div>
        <button type="button" onClick={() => onChange(all ? [] : STAFF_PERMISSIONS.map((p) => p.key))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50">{all ? "Clear all" : "Select all"}</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {GROUPS.map((g) => (
          <fieldset key={g} className="space-y-2">
            <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">{g}</legend>
            {STAFF_PERMISSIONS.filter((p) => p.group === g).map((p) => {
              const on = set.has(p.key);
              return (
                <label key={p.key}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-all ${on ? "border-brand-600/40 bg-white font-medium text-navy-900 shadow-sm ring-2 ring-brand-600/10" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(p.key)} className="peer sr-only" />
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-1 ${on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"}`}>
                    {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                  </span>
                  {p.label}
                </label>
              );
            })}
          </fieldset>
        ))}
      </div>
    </div>
  );
}
