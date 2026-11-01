"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
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
        <div className="field flex items-center justify-between">
          <span className="truncate font-semibold">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Clear customer" className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden />
          <input className="field pl-9" placeholder="Search customer name or phone" value={q} onFocus={() => setOpen(true)}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }} aria-label="Search customer" aria-invalid={!!error} />
        </div>
      )}
      {open && !value && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-card" role="listbox">
          {loading && <li className="px-3 py-2 text-xs text-slate-500">Searching…</li>}
          {!loading && !items.length && <li className="px-3 py-2 text-xs text-slate-500">No customer found</li>}
          {items.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => { onChange(c); setOpen(false); setQ(""); }} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-brand-50">
                <span className="truncate">{c.name}<span className="ml-2 text-xs text-slate-400">{c.phone}</span></span>
                {c.due > 0 && <span className="shrink-0 text-xs font-semibold text-danger">{formatMoney(c.due)}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
