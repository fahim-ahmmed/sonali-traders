"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { formatMoney } from "@/lib/money";

// সার্চযোগ্য কাস্টমার পিকার (শত শত কাস্টমারের জন্য) — POS-এও ব্যবহার হবে
export default function CustomerPicker({ value, onChange, error, label = "Customer" }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/customers/search?q=${encodeURIComponent(q)}`).then((r) => r.json())
        .then((j) => j.ok && setItems(j.data)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative">
      <span className="field-label">{label}</span>
      {value ? (
        <div className="field flex items-center justify-between gap-2 border-brand-100 bg-brand-50/40">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{(value.name || "?").slice(0, 2).toUpperCase()}</span>
            <span className="truncate font-semibold text-navy-900">{value.name}</span>
            {value.phone && <span className="num hidden text-xs text-slate-500 sm:inline">{value.phone}</span>}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {value.due > 0 && <span className="badge badge-danger num">Due {formatMoney(value.due)}</span>}
            {value.advance > 0 && <span className="badge badge-success num">Adv {formatMoney(value.advance)}</span>}
            <button type="button" onClick={() => onChange(null)} aria-label="Clear customer" className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-navy-900"><X className="h-4 w-4" /></button>
          </span>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input className="field pl-10" placeholder="Search customer name or phone" value={q} onFocus={() => setOpen(true)}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }} aria-label="Search customer" aria-invalid={!!error} />
          {loading && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden />}
        </div>
      )}
      {open && !value && (
        <ul className="absolute z-30 mt-1.5 max-h-72 w-full animate-scale-in overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-card-hover" role="listbox">
          {loading && !items.length && <li className="px-3 py-2.5 text-xs text-slate-500">Searching…</li>}
          {!loading && !items.length && <li className="px-3 py-2.5 text-xs text-slate-500">No customer found</li>}
          {items.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => { onChange(c); setOpen(false); setQ(""); }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-brand-50">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{(c.name || "?").slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-navy-900">{c.name}</span>
                    {c.phone && <span className="num block text-xs text-slate-400">{c.phone}</span>}
                  </span>
                </span>
                {c.due > 0 && <span className="badge badge-danger num shrink-0">{formatMoney(c.due)}</span>}
                {!(c.due > 0) && c.advance > 0 && <span className="badge badge-success num shrink-0">{formatMoney(c.advance)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
