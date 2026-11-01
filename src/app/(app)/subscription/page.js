"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BadgeCheck, Banknote, CalendarCheck, CalendarClock, Check, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, Copy, CreditCard, LoaderCircle, ReceiptText,
  ShieldCheck, Smartphone, Wallet,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { nextSubscriptionCycle } from "@/lib/subscription";

const PAYMENT_NUMBER = "01305470835";

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const METHOD_STYLES = {
  bkash: "bg-pink-50 text-pink-700 ring-pink-600/15",
  nagad: "bg-orange-50 text-orange-700 ring-orange-600/15",
};

const PLAN_STATUS = {
  active: { label: "Active", style: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  expiring: { label: "Due soon", style: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  expired: { label: "Expired", style: "bg-rose-50 text-rose-700 ring-rose-600/20" },
  unknown: { label: "Not set", style: "bg-slate-100 text-slate-600 ring-slate-500/15" },
};

const WORKFLOW = [
  "Open bKash or Nagad App and choose “Send Money”.",
  "Send the exact subscription fee to 01305470835.",
  "Enter your Sender Mobile Number and TrxID below to verify.",
];

function MetricCard({ icon: Icon, label, value, detail, badge }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#0B2239] tabular-nums">{value}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#12334F]/[0.06] text-[#12334F]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 flex min-h-6 items-center justify-between gap-2">
        {detail && <p className="text-xs text-slate-500">{detail}</p>}
        {badge && (
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${badge.style}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {badge.label}
          </span>
        )}
      </div>
    </article>
  );
}

function PaymentStatus({ status }) {
  const value = String(status || "pending").toLowerCase();
  const style = STATUS_STYLES[value] || "bg-slate-100 text-slate-600 ring-slate-500/20";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${style}`}>{value}</span>;
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5" aria-label="Loading payment history">
      {[0, 1, 2].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
    </div>
  );
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [method, setMethod] = useState("bkash");
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadPage = useCallback(async (requestedPage = 1) => {
    setHistoryLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/subscription/payments?page=${requestedPage}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not load subscription details.");
      setData(result.data);
      setPage(result.data.page);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load subscription details.";
      setLoadError(message);
      toast(message, "error");
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("Could not copy the payment number. Please copy it manually.", "error");
    }
  }

  async function submitPayment(event) {
    event.preventDefault();
    const errors = {};
    if (!/^01\d{9}$/.test(senderNumber)) errors.senderNumber = "Enter a valid 11-digit mobile number.";
    if (!/^[A-Z0-9]{6,32}$/.test(transactionId)) errors.transactionId = "Use 6–32 uppercase letters or numbers.";
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const previousData = data;
    const cycle = nextSubscriptionCycle(subscription?.validUntil);
    const optimisticPayment = {
      id: `optimistic-${Date.now()}`,
      method,
      senderNumber,
      transactionId,
      amount: subscription.monthlyFee,
      status: "APPROVED",
      submittedAt: new Date().toISOString(),
    };
    const optimisticDays = Math.ceil((cycle.validUntil.getTime() + 86400000 - Date.now()) / 86400000);
    setData((current) => ({
      ...current,
      subscription: {
        ...current.subscription,
        ...cycle,
        state: optimisticDays <= 0 ? "expired" : optimisticDays <= 7 ? "expiring" : "active",
        days: optimisticDays,
      },
      payments: [optimisticPayment, ...current.payments].slice(0, 10),
      total: current.total + 1,
      page: 1,
      pages: Math.max(1, Math.ceil((current.total + 1) / 10)),
    }));
    setPage(1);
    setSubmitting(true);
    try {
      const response = await fetch("/api/subscription/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, senderNumber, transactionId, note }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not submit payment verification.");
      setData((current) => ({
        ...current,
        subscription: result.data.subscription,
        payments: [result.data.payment, ...current.payments.filter((payment) => payment.id !== optimisticPayment.id)].slice(0, 10),
      }));
      setSenderNumber("");
      setTransactionId("");
      setNote("");
      setFormErrors({});
      toast("Payment approved. Your subscription has been renewed.", "success");
      router.refresh();
    } catch (error) {
      setData(previousData);
      toast(error instanceof Error ? error.message : "Could not submit payment verification.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const subscription = data?.subscription;
  const planStatus = PLAN_STATUS[subscription?.state] || PLAN_STATUS.unknown;
  const hasSubscription = Number.isSafeInteger(subscription?.monthlyFee) && subscription.monthlyFee > 0;
  const history = data?.payments || [];

  return (
    <>
      <PageHeader group="Subscription" title="Software subscription" />
      <main className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC]">
        <div className="page space-y-7">
          <section aria-label="Subscription overview">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[#0B2239]">Subscription overview</h2>
                <p className="mt-1 text-sm text-slate-500">Your plan status and upcoming payment schedule.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                Secure account
              </span>
            </div>
            {loadError && !data ? (
              <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700">
                <p>{loadError}</p>
                <button type="button" onClick={() => loadPage(1)} className="mt-3 font-semibold underline underline-offset-2">Try again</button>
              </div>
            ) : !data ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  icon={Wallet}
                  label="Monthly Fee"
                  value={hasSubscription ? formatMoney(subscription.monthlyFee) : "—"}
                  detail="Billed monthly"
                />
                <MetricCard
                  icon={CalendarCheck}
                  label="Valid Until"
                  value={subscription?.validUntil ? formatDate(subscription.validUntil) : "Not set"}
                  detail={subscription?.state === "expired" ? "Subscription period ended" : "Current plan validity"}
                  badge={planStatus}
                />
                <MetricCard
                  icon={CalendarClock}
                  label="Next Payment Date"
                  value={subscription?.nextPaymentDate ? formatDate(subscription.nextPaymentDate) : "Not set"}
                  detail={subscription?.days === null || subscription?.days === undefined ? "Payment schedule" : `${subscription.days} day${subscription.days === 1 ? "" : "s"} left`}
                  badge={planStatus}
                />
              </div>
            )}
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[0.92fr_1.08fr]" aria-label="Submit a subscription payment">
            <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E8941A]/10 text-[#B66C00]">
                  <Smartphone className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-bold text-[#0B2239]">Payment instructions</h2>
                  <p className="text-xs text-slate-500">Pay securely using bKash or Nagad</p>
                </div>
              </div>

              <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2239] via-[#12334F] to-[#1769AA] p-5 text-white">
                <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full border-[24px] border-white/[0.05]" />
                <div className="pointer-events-none absolute -bottom-16 right-20 h-40 w-40 rounded-full bg-[#E8941A]/20 blur-3xl" />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">Send money to</p>
                    <p className="mt-2 text-2xl font-bold tracking-[0.08em] tabular-nums">{PAYMENT_NUMBER}</p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">Personal</span>
                </div>
                <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-white/15 pt-4">
                  <span className="inline-flex items-center gap-2 text-xs text-white/80">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    bKash / Nagad · Send Money
                  </span>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-bold text-[#0B2239] transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copied ? "Copied!" : "Copy Number"}
                  </button>
                </div>
              </div>

              <ol className="mt-6 space-y-5">
                {WORKFLOW.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#12334F]/[0.07] text-xs font-bold text-[#12334F]">{index + 1}</span>
                    <p className="pt-1 text-sm leading-5 text-slate-600">{step}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/70 p-3.5 text-xs leading-5 text-amber-900">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>Keep your transaction ID for your records. Submitting the payment details renews your plan immediately.</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#0B2239]">Submit Payment Verification</h2>
                  <p className="mt-1 text-sm text-slate-500">Enter the details from your successful Send Money transaction.</p>
                </div>
                <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#12334F]/[0.06] text-[#12334F] sm:grid">
                  <ReceiptText className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>

              <form className="mt-6 space-y-5" onSubmit={submitPayment} noValidate>
                <fieldset disabled={submitting || !hasSubscription} className="space-y-5 disabled:opacity-70">
                  <legend className="sr-only">Payment details</legend>
                  <div>
                    <span className="mb-2 block text-xs font-semibold tracking-wide text-slate-600">PAYMENT METHOD</span>
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Payment method">
                      {["bkash", "nagad"].map((item) => {
                        const selected = method === item;
                        const activeStyle = item === "bkash"
                          ? "bg-white text-pink-700 shadow-sm ring-1 ring-pink-200"
                          : "bg-white text-orange-700 shadow-sm ring-1 ring-orange-200";
                        return (
                          <button
                            key={item}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setMethod(item)}
                            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold capitalize transition ${selected ? activeStyle : "text-slate-500 hover:text-slate-800"}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${item === "bkash" ? "bg-pink-500" : "bg-orange-500"}`} aria-hidden="true" />
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="senderNumber" className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600">SENDER MOBILE NUMBER</label>
                      <input
                        id="senderNumber"
                        autoComplete="tel"
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="01XXXXXXXXX"
                        value={senderNumber}
                        onChange={(event) => {
                          setSenderNumber(event.target.value.replace(/\D/g, "").slice(0, 11));
                          setFormErrors((current) => ({ ...current, senderNumber: "" }));
                        }}
                        aria-invalid={Boolean(formErrors.senderNumber)}
                        aria-describedby={formErrors.senderNumber ? "senderNumber-error" : undefined}
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1769AA] focus:ring-4 focus:ring-[#1769AA]/10 aria-[invalid=true]:border-rose-500"
                      />
                      {formErrors.senderNumber && <p id="senderNumber-error" className="mt-1 text-xs text-rose-600">{formErrors.senderNumber}</p>}
                    </div>
                    <div>
                      <label htmlFor="transactionId" className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600">TRANSACTION ID (TRX ID)</label>
                      <input
                        id="transactionId"
                        autoComplete="off"
                        maxLength={32}
                        placeholder="e.g. BL7A9X8K2"
                        value={transactionId}
                        onChange={(event) => {
                          setTransactionId(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 32));
                          setFormErrors((current) => ({ ...current, transactionId: "" }));
                        }}
                        aria-invalid={Boolean(formErrors.transactionId)}
                        aria-describedby={formErrors.transactionId ? "transactionId-error" : undefined}
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm uppercase tracking-wide text-slate-900 shadow-sm outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1769AA] focus:ring-4 focus:ring-[#1769AA]/10 aria-[invalid=true]:border-rose-500"
                      />
                      {formErrors.transactionId && <p id="transactionId-error" className="mt-1 text-xs text-rose-600">{formErrors.transactionId}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="paymentAmount" className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600">AMOUNT</label>
                    <div className="relative">
                      <Banknote className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input id="paymentAmount" readOnly value={hasSubscription ? formatMoney(subscription.monthlyFee) : "Loading subscription fee…"} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 text-sm font-semibold tabular-nums text-[#0B2239] outline-none" />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">The amount is set from your current subscription plan.</p>
                  </div>

                  <div>
                    <label htmlFor="paymentNote" className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-600">REFERENCE / NOTE <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                    <input
                      id="paymentNote"
                      maxLength={300}
                      placeholder="Add a note for the reviewer"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1769AA] focus:ring-4 focus:ring-[#1769AA]/10"
                    />
                  </div>
                </fieldset>

                {!hasSubscription && data && (
                  <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800" role="status">Subscription fee is not configured. Please contact your administrator before submitting payment.</p>
                )}
                <button
                  type="submit"
                  disabled={submitting || !hasSubscription}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2239] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#12334F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Submitting…</> : <>Submit Payment Verification <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  Submission is available to the signed-in administrator only.
                </p>
              </form>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm" aria-label="Payment history">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#12334F]/[0.06] text-[#12334F]">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-bold text-[#0B2239]">Payment history</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{data ? `${data.total} submission${data.total === 1 ? "" : "s"}` : "Your recent subscription payments"}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Latest first
              </span>
            </div>

            {historyLoading ? <LoadingRows /> : history.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="relative grid h-20 w-20 place-items-center rounded-full bg-[#12334F]/[0.05]">
                  <span className="absolute inset-2 rounded-full border border-dashed border-[#12334F]/20" />
                  <ReceiptText className="h-8 w-8 text-[#12334F]/60" aria-hidden="true" />
                  <span className="absolute right-1 top-2 grid h-7 w-7 place-items-center rounded-full bg-white text-[#E8941A] shadow-sm"><Wallet className="h-4 w-4" aria-hidden="true" /></span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#0B2239]">No payment submissions yet</h3>
                <p className="mt-1 max-w-sm text-sm text-slate-500">Your bKash or Nagad verification submissions will appear here after you send a payment.</p>
              </div>
            ) : (
              <>
                <div className="max-h-[460px] overflow-auto">
                  <table className="min-w-[900px] w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-[1] bg-slate-50 px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-slate-500">DATE</th>
                        <th className="sticky top-0 z-[1] bg-slate-50 px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-slate-500">METHOD</th>
                        <th className="sticky top-0 z-[1] bg-slate-50 px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-slate-500">SENDER NUMBER</th>
                        <th className="sticky top-0 z-[1] bg-slate-50 px-4 py-3 text-right text-[10px] font-bold tracking-[0.12em] text-slate-500">AMOUNT</th>
                        <th className="sticky top-0 z-[1] bg-slate-50 px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-slate-500">TRX ID</th>
                        <th className="sticky top-0 z-[1] bg-slate-50 px-4 py-3 text-[10px] font-bold tracking-[0.12em] text-slate-500">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((payment) => (
                        <tr key={payment.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600">{formatDate(payment.submittedAt)}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${METHOD_STYLES[payment.method] || "bg-slate-50 text-slate-600 ring-slate-500/20"}`}>
                              {payment.method}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm tabular-nums text-slate-600">{payment.senderNumber}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-[#0B2239]">{formatMoney(payment.amount)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-semibold tracking-wide text-slate-700">{payment.transactionId}</td>
                          <td className="px-4 py-3.5"><PaymentStatus status={payment.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 sm:px-6">
                  <p className="text-xs text-slate-500">Page <span className="font-semibold text-slate-700">{data.page}</span> of <span className="font-semibold text-slate-700">{data.pages}</span></p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => loadPage(page - 1)} disabled={page <= 1 || historyLoading} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />Previous
                    </button>
                    <button type="button" onClick={() => loadPage(page + 1)} disabled={page >= data.pages || historyLoading} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                      Next<ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
          <p className="pb-2 text-center text-xs text-slate-400">Developed by Bengal Tech Hub Solution. Plan changes are handled by the developer.</p>
        </div>
      </main>
    </>
  );
}
