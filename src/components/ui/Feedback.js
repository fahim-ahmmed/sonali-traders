import Link from "next/link";
import { Inbox, Plus } from "lucide-react";

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />;
}

// পূর্ণ ক্লাস নাম রাখা জরুরি — Tailwind ডায়নামিক `badge-${tone}` খুঁজে পায় না
const TONES = {
  info: "badge badge-info",
  success: "badge badge-success",
  danger: "badge badge-danger",
  warning: "badge badge-warning",
  neutral: "badge badge-neutral",
};

export function Badge({ tone = "info", children }) {
  return <span className={TONES[tone] || TONES.info}>{children}</span>;
}

export function EmptyState({ title, hint, actionHref, actionLabel, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="relative mb-2">
        <div className="absolute inset-0 rounded-2xl bg-brand-600/10 blur-xl" aria-hidden />
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-card">
          <Icon className="h-6 w-6 text-brand-600" aria-hidden />
        </div>
      </div>
      <p className="text-sm font-semibold text-navy-900">{title}</p>
      {hint && <p className="max-w-xs text-xs leading-relaxed text-slate-500">{hint}</p>}
      {actionHref && (
        <Link
          href={actionHref}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {actionLabel?.replace(/^\+\s*/, "")}
        </Link>
      )}
    </div>
  );
}
