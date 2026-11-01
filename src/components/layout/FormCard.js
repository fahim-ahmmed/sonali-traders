import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// ফর্ম পেজের কার্ড: আইকন + শিরোনাম + সাবটাইটেল, ঐচ্ছিক ব্যাক লিংক
export default function FormCard({ title, subtitle, icon: Icon, backHref, backLabel, wide = false, children }) {
  return (
    <div className={`space-y-4 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {backLabel}
        </Link>
      )}
      <section className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-inset ring-brand-600/10">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            )}
            <div>
              <h2 className="text-base font-semibold text-navy-900">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}
