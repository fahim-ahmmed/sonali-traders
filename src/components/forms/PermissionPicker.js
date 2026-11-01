"use client";
import { STAFF_PERMISSIONS } from "@/lib/permissions";

const GROUPS = ["Sales", "Inventory", "People"];

export default function PermissionPicker({ value, onChange }) {
  const set = new Set(value);
  const toggle = (k) => { const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); onChange([...n]); };
  const all = STAFF_PERMISSIONS.every((p) => set.has(p.key));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="field-label !mb-0">Staff permissions</span>
        <button type="button" onClick={() => onChange(all ? [] : STAFF_PERMISSIONS.map((p) => p.key))} className="text-xs font-semibold text-brand-600 hover:underline">{all ? "Clear all" : "Select all"}</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {GROUPS.map((g) => (
          <fieldset key={g} className="rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{g}</legend>
            {STAFF_PERMISSIONS.filter((p) => p.group === g).map((p) => (
              <label key={p.key} className="flex min-h-[36px] cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={set.has(p.key)} onChange={() => toggle(p.key)} className="h-4 w-4 accent-brand-600" /> {p.label}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </div>
  );
}
