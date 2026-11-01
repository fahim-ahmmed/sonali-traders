"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/dates";

// শুধু প্রিন্টে দেখা যায়: লোগো, কোম্পানির তথ্য, রিপোর্টের নাম
export default function PrintHeader({ title, subtitle }) {
  const [c, setC] = useState(null);
  useEffect(() => { fetch("/api/settings").then((r) => r.json()).then((j) => j.ok && setC(j.data)); }, []);
  return (
    <div className="print-only mb-4 border-b border-slate-300 pb-3">
      <div className="flex items-center gap-3">
        {c?.logoUrl && <img src={c.logoUrl} alt="" className="h-14 w-auto" />}
        <div>
          <p className="text-lg font-bold">{c?.companyName || "Sonali Trading"}</p>
          <p className="text-xs">{[c?.address, c?.phone && `Phone: ${c.phone}`, c?.hotline && `Hotline: ${c.hotline}`].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold">{title}{subtitle ? ` — ${subtitle}` : ""}</p>
      <p className="text-xs text-slate-500">Printed {formatDate(new Date())}</p>
    </div>
  );
}
