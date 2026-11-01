import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return total ? <p className="num border-t border-slate-100 px-5 py-3 text-xs text-slate-500">{total} total</p> : null;
  const btn = "grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-[0_1px_2px_rgba(11,34,57,0.04)] transition-all hover:border-slate-300 hover:text-navy-900 disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className="no-print flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
      <p className="num text-xs text-slate-500">
        Page <span className="font-semibold text-navy-900">{page}</span> of {pages} · {total} total
      </p>
      <div className="flex gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <button className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
