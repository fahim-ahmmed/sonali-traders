import { CalendarDays, ChevronRight, Home } from "lucide-react";
import { formatDate } from "@/lib/dates";

// স্টিকি নেভি → সোনালি গ্রেডিয়েন্ট হেডার: breadcrumb + শিরোনাম + আজকের তারিখ (Asia/Dhaka)
export default function PageHeader({ group, title, children }) {
  const crumbs = String(group || "").split("/").map((s) => s.trim()).filter(Boolean);
  const today = formatDate(new Date(), { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="no-print sticky top-0 z-30 bg-gradient-to-r from-navy-900 via-navy-800 to-gold-500 py-3.5 pl-16 pr-4 text-white shadow-md shadow-navy-900/10 backdrop-blur-md sm:pr-6 md:pl-6 lg:pl-8 lg:pr-8">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] font-medium text-white/60">
            <Home className="h-3 w-3 shrink-0" aria-hidden />
            {crumbs.map((c, i) => (
              <span key={i} className="flex min-w-0 items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0 text-white/40" aria-hidden />
                <span className={`truncate ${i === crumbs.length - 1 ? "text-white/90" : ""}`}>{c}</span>
              </span>
            ))}
          </nav>
          <h1 className="mt-0.5 truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {children}
          <span
            suppressHydrationWarning
            className="hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:inline-flex"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {today}
          </span>
        </div>
      </div>
    </header>
  );
}
