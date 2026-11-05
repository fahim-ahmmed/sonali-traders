"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dates";

const STORAGE_KEY = "sonali_seen_notifications_v1";

const STATUS_BADGE = {
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", Icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-800 ring-amber-600/20", Icon: Clock },
  declined: { label: "Declined", cls: "bg-rose-50 text-rose-700 ring-rose-600/20", Icon: XCircle },
};

const PAY_BADGE = {
  Paid: "bg-emerald-100 text-emerald-800",
  "Partial Paid": "bg-sky-100 text-sky-800",
  Unpaid: "bg-rose-100 text-rose-800",
  Collection: "bg-indigo-100 text-indigo-800",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("all");
  const [seenMap, setSeenMap] = useState({});
  const wrapRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      setSeenMap(saved);
    } catch {
      setSeenMap({});
    }
  }, []);

  const load = useCallback(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setData(j.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const items = data?.items || [];
  const isAdmin = data?.role === "admin";

  // যেসব আইটেমের বর্তমান স্ট্যাটাস এখনো দেখা হয়নি সেগুলোর সংখ্যা
  const unseenCount = items.filter((item) => seenMap[item.id] !== item.status).length;
  const badgeCount = isAdmin ? (data?.pendingCount || unseenCount) : unseenCount;

  function markAllSeen(currentItems) {
    const next = { ...seenMap };
    for (const item of currentItems) {
      next[item.id] = item.status;
    }
    setSeenMap(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      load();
      if (items.length) markAllSeen(items);
    }
  }

  const filtered = items.filter((item) => (tab === "all" ? true : item.status === tab));

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {badgeCount > 0 && (
          <span className="num absolute -right-1 -top-1 grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-white shadow ring-2 ring-navy-900">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className=" fixed inset-x-3 top-16 z-50 max-h-[82vh] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-navy-900 px-4 py-3 text-white">
            <div>
              <h3 className="text-sm font-bold">Notifications</h3>
              <p className="text-[11px] text-slate-300">
                {isAdmin ? "Staff POS requests & approval status" : "Your POS order approval & payment status"}
              </p>
            </div>
            {data?.pendingCount > 0 && (
              <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                {data.pendingCount} Pending
              </span>
            )}
          </div>

          <div className="flex gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["approved", "Approved"],
              ["declined", "Declined"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  tab === key ? "bg-navy-900 text-white" : "bg-white text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto">
            {!filtered.length ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No notifications in this tab.
              </div>
            ) : (
              filtered.map((item) => {
                const st = STATUS_BADGE[item.status] || STATUS_BADGE.pending;
                const StatusIcon = st.Icon;
                const payCls = PAY_BADGE[item.paymentStatus] || PAY_BADGE.Unpaid;

                return (
                  <div key={item.id} className="space-y-2 px-4 py-3.5 transition-colors hover:bg-slate-50/80">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy-900">
                          {item.customerName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.invoiceNo ? <span className="num font-semibold text-brand-700">{item.invoiceNo} · </span> : null}
                          {formatDate(item.date)}
                          {isAdmin && item.submittedBy ? ` · by ${item.submittedBy}` : ""}
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${st.cls}`}>
                        <StatusIcon className="h-3 w-3" aria-hidden />
                        {st.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-slate-500">
                          Total: <b className="num text-navy-900">{formatMoney(item.total)}</b>
                        </span>
                        <span className="text-slate-500">
                          Paid: <b className="num text-emerald-700">{formatMoney(item.paid)}</b>
                        </span>
                        {item.due > 0 && (
                          <span className="text-slate-500">
                            Due: <b className="num text-rose-600">{formatMoney(item.due)}</b>
                          </span>
                        )}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${payCls}`}>
                        {item.paymentStatus}
                      </span>
                    </div>

                    {item.status === "declined" && item.declineNote && (
                      <p className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">
                        <b>Reason:</b> {item.declineNote}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {isAdmin && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-right">
              <Link
                href="/approvals"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                Go to Approval Section <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}