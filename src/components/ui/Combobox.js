"use client";
import { useState } from "react";

// সার্চযোগ্য ড্রপডাউন; ↑ ↓ Enter Esc সমর্থিত। options: [{ value, label, sub }]
export default function Combobox({ options, value, onSelect, placeholder = "Search…", onAfterSelect, error, ...rest }) {
  const sel = options.find((o) => o.value === value);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const needle = text.trim().toLowerCase();
  const list = options.filter((o) => !needle || `${o.label} ${o.sub || ""}`.toLowerCase().includes(needle)).slice(0, 30);

  const choose = (o) => { onSelect(o); setOpen(false); setText(""); onAfterSelect?.(); };

  function onKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && open && list[hi]) { e.preventDefault(); choose(list[hi]); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative">
      <input
        {...rest}
        className="field" role="combobox" aria-expanded={open} aria-invalid={!!error}
        placeholder={placeholder} autoComplete="off"
        value={open ? text : sel?.label ?? ""}
        onFocus={(e) => { setOpen(true); setText(""); setHi(0); e.target.select?.(); }}
        onBlur={() => setOpen(false)}
        onChange={(e) => { setText(e.target.value); setHi(0); setOpen(true); }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-card" role="listbox">
          {!list.length && <li className="px-3 py-2 text-xs text-slate-500">No match</li>}
          {list.map((o, i) => (
            <li key={o.value} role="option" aria-selected={i === hi}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setHi(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === hi ? "bg-brand-50" : ""}`}>
              {o.label}{o.sub && <span className="ml-2 text-xs text-slate-400">{o.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
