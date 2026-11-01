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
      <main className="p-5 sm:p-8">
        <div className="card max-w-xl p-6">
          <h2 className="text-lg font-bold text-navy-900">Subscription</h2>
          <p className={`mb-4 mt-1 rounded-lg px-3 py-2 text-sm ${state === "expired" ? "bg-red-50 text-danger" : state === "expiring" ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-600"}`}>{MSG[state]}</p>
          {sub === undefined ? <Skeleton className="h-48" /> : <SubscriptionCard sub={sub} />}
          <p className="mt-4 text-xs text-slate-400">Developed by Bengal Tech Hub Solution. Plan changes are handled by the developer.</p>
        </div>
      </main>
    </>
  );
}
