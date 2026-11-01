"use client";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Info, Loader2, Lock, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";

// ট্যাব শুধু UI-প্রসঙ্গ বদলায়; আসল রোল অ্যাকাউন্ট থেকেই আসে
const ROLES = [
  { key: "admin", label: "Admin Login", icon: ShieldCheck, subtitle: "Sign in to manage sales, stock, accounts and reports.", cta: "Sign In to Admin Panel" },
  { key: "staff", label: "Staff Login", icon: UserRound, subtitle: "Sign in to record sales, purchases and expenses.", cta: "Sign In to Staff Workspace" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const e = {};
  if (!email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(email.trim())) e.email = "Enter a valid email address.";
  if (!password) e.password = "Password is required.";
  return e;
}

function Field({ id, label, icon: Icon, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-900">{label}</label>
      <div
        className={`group relative flex items-center rounded-xl border bg-white transition-all duration-200 focus-within:ring-4 ${
          error
            ? "border-danger focus-within:ring-danger/15"
            : "border-slate-200 hover:border-slate-300 focus-within:border-brand-600 focus-within:ring-brand-600/15"
        }`}
      >
        <Icon className={`pointer-events-none ml-3.5 h-4 w-4 shrink-0 transition-colors ${error ? "text-danger" : "text-slate-400 group-focus-within:text-brand-600"}`} aria-hidden />
        {children}
      </div>
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export default function LoginForm() {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);

  const active = ROLES.find((r) => r.key === role);
  const errors = validate({ email, password });
  const fieldError = (k) => (touched[k] ? errors[k] : undefined);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return; // ডাবল সাবমিট সুরক্ষা
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length) return;
    setError("");
    setLoading(true);
    const { error } = await authClient.signIn.email({ email: email.trim(), password, rememberMe: remember });
    if (error) {
      setError("Email or password is incorrect. Please try again.");
      setLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(11,34,57,.04),0_12px_40px_-8px_rgba(11,34,57,.14)] sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-navy-900">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">{active.subtitle}</p>
      </div>

      {/* রোল সুইচার (segmented control) */}
      <div role="tablist" aria-label="Login type" className="relative mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm ring-1 ring-slate-200/70 transition-transform duration-300 ease-out ${role === "staff" ? "translate-x-full" : ""}`}
        />
        {ROLES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={role === key}
            onClick={() => setRole(key)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors duration-200 ${
              role === key ? "text-navy-900" : "text-slate-500 hover:text-navy-800"
            }`}
          >
            <Icon className={`h-4 w-4 transition-colors ${role === key ? "text-brand-600" : ""}`} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field id="email" label="Email Address" icon={Mail} error={fieldError("email")}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={!!fieldError("email")}
            aria-describedby={fieldError("email") ? "email-error" : undefined}
            className="w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
          />
        </Field>

        <Field id="password" label="Password" icon={Lock} error={fieldError("password")}>
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            aria-invalid={!!fieldError("password")}
            aria-describedby={fieldError("password") ? "password-error" : undefined}
            className="w-full rounded-xl bg-transparent px-3 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="mr-1.5 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-brand-600"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => setShowHint((s) => !s)}
            aria-expanded={showHint}
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            Forgot password?
          </button>
        </div>

        {showHint && (
          <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 text-xs text-brand-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Please ask your administrator to reset your password from the Staff page.
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 via-brand-700 to-navy-800 bg-[length:200%_100%] bg-left px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 active:translate-y-0 active:scale-[.98] disabled:pointer-events-none disabled:opacity-80"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            <>
              {active.cta}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-100 pt-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <LockKeyhole className="h-3.5 w-3.5 text-success" aria-hidden />
          SSL Encrypted
        </span>
        <span className="h-3 w-px bg-slate-200" aria-hidden />
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden />
          Protected workspace
        </span>
      </div>
    </div>
  );
}
