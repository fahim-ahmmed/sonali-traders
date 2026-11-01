import { Loader2 } from "lucide-react";

const styles = {
  primary: "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-600/25 hover:from-brand-600 hover:to-brand-700 hover:shadow-md hover:shadow-brand-600/30",
  gold: "bg-gradient-to-r from-gold-500 to-amber-500 text-white shadow-lg shadow-amber-500/25 hover:brightness-110",
  success: "bg-success text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500 hover:shadow-md",
  danger: "bg-danger text-white shadow-sm shadow-rose-600/20 hover:bg-rose-600 hover:shadow-md",
  ghost: "border border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(11,34,57,0.04)] hover:border-slate-300 hover:bg-slate-50 hover:text-navy-900",
  "danger-ghost": "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50",
};

export default function Button({ variant = "primary", loading = false, className = "", children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-60 ${styles[variant] || styles.primary} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
