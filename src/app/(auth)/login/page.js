import { CalendarCheck, CalendarClock, CircleCheck, Wallet } from "lucide-react";
import { connectDB } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { subscriptionStatus } from "@/lib/subscription";
import Settings from "@/models/Settings";
import Subscription from "@/models/Subscription";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in · Sonali Trading" };
export const dynamic = "force-dynamic"; // বিল্ডের সময় DB-তে না গিয়ে প্রতি রিকোয়েস্টে লাইভ সাবস্ক্রিপশন

const FEATURES = [
  "Point of sale with instant invoicing",
  "Live stock & purchase tracking",
  "Customer due & advance ledger",
  "Daily and monthly profit reports",
];

const BADGE = {
  active: { label: "Active", cls: "border-success/30 bg-success/15 text-emerald-300" },
  expiring: { label: "Due soon", cls: "border-warning/30 bg-warning/15 text-amber-300" },
  expired: { label: "Overdue", cls: "border-danger/30 bg-danger/15 text-red-300" },
};

// সার্ভারে পড়া ও ফরম্যাট (hydration mismatch এড়াতে ক্লায়েন্টে শুধু স্ট্রিং যায়)
async function loadInfo() {
  try {
    await connectDB();
    const [s, sub] = await Promise.all([
      Settings.findOne({ key: "main" }).lean(),
      Subscription.findOne({ key: "main" }).lean(),
    ]);
    const company = { name: s?.companyName || "Sonali Trading", logoUrl: s?.logoUrl || "" };
    if (!sub) return { company, plan: null };
    const st = subscriptionStatus(sub);
    return {
      company,
      plan: {
        fee: formatMoney(sub.monthlyFee),
        validUntil: sub.validUntil ? formatDate(sub.validUntil) : "—",
        nextPayment: sub.nextPaymentDate ? formatDate(sub.nextPaymentDate) : "—",
        badge: BADGE[st.state] || null,
      },
    };
  } catch (e) {
    console.error("login: failed to load company info", e);
    return { company: { name: "Sonali Trading", logoUrl: "" }, plan: null };
  }
}

function Logo({ company, className = "" }) {
  return company.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={company.logoUrl} alt={company.name} className={`h-11 w-11 rounded-xl bg-white object-contain p-1 ${className}`} />
  ) : (
    <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 text-lg font-bold text-white shadow-lg shadow-gold-500/30 ${className}`}>
      {company.name.charAt(0)}
    </div>
  );
}

export default async function LoginPage() {
  const { company, plan } = await loadInfo();

  return (
    <main className="flex min-h-screen bg-surface">
      {/* বাম প্যানেল: ব্র্যান্ডিং ও সাবস্ক্রিপশন (lg+) */}
      <section className="relative hidden w-1/2 overflow-hidden bg-navy-900 text-white lg:flex xl:w-[55%]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(23,105,170,.45),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(232,148,26,.22),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo company={company} />
              <div>
                <p className="text-lg font-semibold tracking-tight">{company.name}</p>
                <p className="text-xs text-slate-400">Rod & Cement Management</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success shadow-[0_0_8px_#1F9D63]" />
              </span>
              System Online
            </span>
          </header>

          <div className="max-w-lg py-12">
            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Manage Your Trading Operations with{" "}
              <span className="bg-gradient-to-r from-gold-500 to-amber-300 bg-clip-text text-transparent">Precision.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              Sales, stock, customer balances and profit — one secure workspace for your whole business.
            </p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-200">
                  <CircleCheck className="h-5 w-5 shrink-0 text-gold-500" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {plan ? (
            <div className="max-w-lg rounded-2xl border border-white/10 bg-white/[.06] p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subscription</p>
                {plan.badge && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${plan.badge.cls}`}>{plan.badge.label}</span>
                )}
              </div>
              <dl className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Wallet className="h-3.5 w-3.5" aria-hidden />Monthly Fee</dt>
                  <dd className="mt-1 text-base font-semibold tabular-nums">{plan.fee}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-slate-400"><CalendarCheck className="h-3.5 w-3.5" aria-hidden />Valid Until</dt>
                  <dd className="mt-1 text-base font-semibold">{plan.validUntil}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-slate-400"><CalendarClock className="h-3.5 w-3.5" aria-hidden />Next Payment</dt>
                  <dd className="mt-1 text-base font-semibold">{plan.nextPayment}</dd>
                </div>
              </dl>
            </div>
          ) : <div />}
        </div>
      </section>

      {/* ডান প্যানেল: লগইন ফর্ম */}
      <section className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,105,170,.08),transparent_60%)]" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Logo company={company} />
            <p className="text-xl font-semibold tracking-tight text-navy-900">{company.name}</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
