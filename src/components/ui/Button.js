import { Loader2 } from "lucide-react";

const styles = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  gold: "bg-gold-500 text-white hover:brightness-95",
  success: "bg-success text-white hover:brightness-95",
  danger: "bg-danger text-white hover:brightness-95",
  ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

export default function Button({ variant = "primary", loading = false, className = "", children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
