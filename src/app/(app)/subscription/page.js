"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { SubscriptionCard } from "@/components/dashboard/DashboardClient";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

const MSG = {
  active: "Your subscription is active.",
  expiring: "Your subscription ends soon. Please arrange the next payment to avoid interruption.",
  expired: "Your subscription period has ended. Please contact your software provider to renew.",
  unknown: "Subscription details have not been set up yet.",
};

export default function SubscriptionPage() {
  const { toast } = useToast();
  const [sub, setSub] = useState(undefined);
  useEffect(() => { fetch("/api/subscription").then((r) => r.json()).then((j) => { if (j.ok) setSub(j.data); else toast(j.error, "error"); }); }, [toast]);
  const state = sub?.state || "unknown";
  return (
    <>
      <PageHeader group="Subscription" title="Software subscription" />
      <main className="page">
        <div className="card max-w-xl overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Subscription</h2>
              <p className="mt-0.5 text-xs text-slate-500">Your software plan and payment schedule</p>
            </div>
          </div>
          <div className="p-5">
            <p className={`mb-4 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${state === "expired" ? "bg-rose-50 text-rose-700 ring-rose-600/20" : state === "expiring" ? "bg-amber-50 text-amber-800 ring-amber-600/20" : "bg-slate-50 text-slate-600 ring-slate-500/10"}`}>{MSG[state]}</p>
            {sub === undefined ? <Skeleton className="h-56" /> : <SubscriptionCard sub={sub} />}
            <p className="mt-5 text-xs text-slate-400">Developed by Bengal Tech Hub Solution. Plan changes are handled by the developer.</p>
          </div>
        </div>
      </main>
    </>
  );
}
