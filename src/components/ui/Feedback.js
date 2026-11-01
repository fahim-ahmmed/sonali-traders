import Link from "next/link";
import { Inbox } from "lucide-react";

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export function Badge({ tone = "info", children }) {
  const tones = {
    info: "bg-brand-50 text-brand-700",
    success: "bg-emerald-50 text-success",
    danger: "bg-red-50 text-danger",
    warning: "bg-amber-50 text-amber-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, hint, actionHref, actionLabel }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Inbox className="h-10 w-10 text-slate-300" aria-hidden />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {actionHref && (
        <Link href={actionHref} className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
