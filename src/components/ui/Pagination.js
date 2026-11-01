import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return total ? <p className="px-4 py-3 text-xs text-slate-500">{total} total</p> : null;
  const btn = "grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40";
  return (
    <div className="no-print flex items-center justify-between px-4 py-3">
      <p className="text-xs text-slate-500">Page {page} of {pages} · {total} total</p>
      <div className="flex gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <button className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
