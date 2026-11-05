"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, ChevronDown, Download, FilePlus2, FileSpreadsheet,
  Pencil, Plus, Search, Trash2, Users, X,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CustomerPicker from "@/components/forms/CustomerPicker";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey } from "@/lib/dates";
import { formatMoney, toPaisa, toTaka } from "@/lib/money";

const DEFAULT_CEMENT_SUBS = [
  { key: "Fresh", label: "Fresh Cement" },
  { key: "Aman", label: "Aman Cement" },
  { key: "Dhalai Special", label: "Dhalai Special" },
  { key: "Bashundhara", label: "Bashundhara Cement" },
  { key: "Holcim", label: "Holcim Cement" },
  { key: "Dhaka", label: "Dhaka Cement" },
];

const DEFAULT_ROD_SUBS = [
  { key: "BSRM", label: "BSRM Rod" },
  { key: "GPH", label: "GPH Ispat" },
  { key: "RICL", label: "RICL (Dhaka)" },
  { key: "ZSRM", label: "ZSRM (Dhaka)" },
];

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function CustomerListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();
  const category = sp.get("category") || "";
  const sub = sp.get("sub") || "";
  const dueOnly = sp.get("due") === "1";
  const sortDue = sp.get("sort") === "due";

  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [dbCategories, setDbCategories] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Average Sale ও Last Month Collection ম্যানুয়ালি অ্যাড/এডিট করার স্টেট
  const [editingMetrics, setEditingMetrics] = useState(null);
  const [metricsSaving, setMetricsSaving] = useState(false);

  // Old Due ফর্ম (collapsible)
  const [showDue, setShowDue] = useState(false);
  const [due, setDue] = useState({ customer: null, amount: "", date: dhakaDateKey(), note: "" });
  const [dueErr, setDueErr] = useState({});
  const [dueSaving, setDueSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDq(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setDbCategories(j.data || []); })
      .catch(() => {});
  }, []);

  const cementSubs = useMemo(() => {
    const map = new Map(DEFAULT_CEMENT_SUBS.map((item) => [item.key.toLowerCase(), item]));
    for (const c of dbCategories) {
      if (String(c.category).toUpperCase() === "CEMENT") {
        const cleanKey = c.brand.replace(/\s+cement$/i, "").trim();
        if (!map.has(cleanKey.toLowerCase())) {
          map.set(cleanKey.toLowerCase(), { key: cleanKey, label: c.brand });
        }
      }
    }
    return [...map.values()];
  }, [dbCategories]);

  const rodSubs = useMemo(() => {
    const map = new Map(DEFAULT_ROD_SUBS.map((item) => [item.key.toLowerCase(), item]));
    for (const c of dbCategories) {
      if (String(c.category).toUpperCase() === "ROD") {
        const cleanKey = c.brand.trim();
        const exists = [...map.keys()].some((k) => cleanKey.toLowerCase().includes(k));
        if (!exists) {
          map.set(cleanKey.toLowerCase(), { key: cleanKey, label: c.brand });
        }
      }
    }
    return [...map.values()];
  }, [dbCategories]);

  const setParam = (k, v) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    setPage(1);
    router.replace(`/customers${p.toString() ? `?${p}` : ""}`);
  };

  const setCategoryFilter = (cat, subValue = "") => {
    const p = new URLSearchParams(sp.toString());
    if (cat) p.set("category", cat); else p.delete("category");
    if (subValue) p.set("sub", subValue); else p.delete("sub");
    setPage(1);
    router.replace(`/customers${p.toString() ? `?${p}` : ""}`);
  };

  const load = useCallback(() => {
    const p = new URLSearchParams({ page, limit: 25 });
    if (dq) p.set("q", dq);
    if (category) p.set("category", category);
    if (sub) p.set("sub", sub);
    if (dueOnly) p.set("due", "1");
    if (sortDue) p.set("sort", "due");
    fetch(`/api/customers?${p}`).then((r) => r.json()).then((j) => j.ok ? setData(j.data) : toast(j.error, "error"));
  }, [page, dq, category, sub, dueOnly, sortDue, toast]);
  useEffect(load, [load]);

  async function saveDue(e) {
    e.preventDefault();
    if (dueSaving) return;
    const er = {};
    if (!due.customer) er.customer = "Select a customer";
    if (!(Number(due.amount) > 0)) er.amount = "Enter an amount more than 0";
    setDueErr(er);
    if (Object.keys(er).length) return;
    setDueSaving(true);
    const res = await fetch("/api/customers/opening-due", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: due.customer.id, amount: toPaisa(due.amount), date: due.date, note: due.note }),
    }).then((r) => r.json());
    setDueSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Old due added to the ledger");
    setDue({ customer: null, amount: "", date: dhakaDateKey(), note: "" });
    setShowDue(false);
    load();
  }

  function openMetricsModal(c) {
    setEditingMetrics({
      id: c.id,
      name: c.name,
      avgSale: c.avgSale > 0 ? String(toTaka(c.avgSale)) : "",
      lastMonthCollection: c.lastMonthCollection > 0 ? String(toTaka(c.lastMonthCollection)) : "",
      computedAvgSale: c.computedAvgSale || 0,
      computedLastMonthCol: c.computedLastMonthCol || 0,
    });
  }

  async function saveMetrics(e) {
    e.preventDefault();
    if (metricsSaving || !editingMetrics) return;
    setMetricsSaving(true);
    const payload = {
      manualAvgSale: editingMetrics.avgSale === "" ? null : toPaisa(editingMetrics.avgSale),
      manualLastMonthCollection: editingMetrics.lastMonthCollection === "" ? null : toPaisa(editingMetrics.lastMonthCollection),
    };
    const res = await fetch(`/api/customers/${editingMetrics.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json()).catch(() => ({ ok: false, error: "Could not save" }));
    setMetricsSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Customer sale & collection info updated");
    setEditingMetrics(null);
    load();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/customers/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false);
    setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast(res.data.archived ? "Customer archived (ledger kept)" : "Customer deleted");
    load();
  }

  // বর্তমান ফিল্টার অনুযায়ী রঙিন Excel শিট ডাউনলোড
  async function downloadExcel() {
    if (exporting) return;
    setExporting(true);
    try {
      const p = new URLSearchParams({ export: "1" });
      if (dq) p.set("q", dq);
      if (category) p.set("category", category);
      if (sub) p.set("sub", sub);
      if (dueOnly) p.set("due", "1");
      if (sortDue) p.set("sort", "due");

      const res = await fetch(`/api/customers?${p}`).then((r) => r.json());
      if (!res.ok) throw new Error(res.error || "Export failed");
      const rows = res.data.items || [];
      if (!rows.length) {
        toast("No customers found in this filter to export", "error");
        return;
      }

      const filterTitle = [
        category ? `${category.toUpperCase()} CUSTOMERS` : "ALL CUSTOMERS",
        sub ? `(${sub})` : "",
        dueOnly ? "— ONLY WITH DUE" : "",
        dq ? `— Search: "${dq}"` : "",
      ].filter(Boolean).join(" ");

      const totalDue = rows.reduce((s, r) => s + (r.due || 0), 0);
      const totalAdv = rows.reduce((s, r) => s + (r.advance || 0), 0);
      const totalAvgSale = rows.reduce((s, r) => s + (r.avgSale || 0), 0);
      const totalLastCol = rows.reduce((s, r) => s + (r.lastMonthCollection || 0), 0);

      const tableRowsHtml = rows
        .map((c, idx) => {
          const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
          const dueBg = c.due > 0 ? "#FFF1F2" : rowBg;
          const dueColor = c.due > 0 ? "#BE123C" : "#94A3B8";
          const advBg = c.advance > 0 ? "#ECFDF5" : rowBg;
          const advColor = c.advance > 0 ? "#047857" : "#94A3B8";
          const avgBg = c.avgSale > 0 ? "#EFF6FF" : rowBg;
          const avgColor = c.avgSale > 0 ? "#1D4ED8" : "#94A3B8";
          const colBg = c.lastMonthCollection > 0 ? "#FEF3C7" : rowBg;
          const colColor = c.lastMonthCollection > 0 ? "#B45309" : "#94A3B8";

          return `
            <tr>
              <td style="background:${rowBg};border:1px solid #CBD5E1;padding:8px;text-align:center;color:#475569;">${idx + 1}</td>
              <td style="background:${rowBg};border:1px solid #CBD5E1;padding:8px;font-weight:bold;color:#0B2239;">${escapeHtml(c.name)}</td>
              <td style="background:${rowBg};border:1px solid #CBD5E1;padding:8px;color:#0F766E;mso-number-format:'\\@';">${escapeHtml(c.phone || "—")}</td>
              <td style="background:${rowBg};border:1px solid #CBD5E1;padding:8px;color:#334155;">${escapeHtml(c.address || "—")}</td>
              <td style="background:${dueBg};border:1px solid #CBD5E1;padding:8px;text-align:right;font-weight:bold;color:${dueColor};">${formatMoney(c.due || 0)}</td>
              <td style="background:${advBg};border:1px solid #CBD5E1;padding:8px;text-align:right;font-weight:bold;color:${advColor};">${formatMoney(c.advance || 0)}</td>
              <td style="background:${avgBg};border:1px solid #CBD5E1;padding:8px;text-align:right;font-weight:bold;color:${avgColor};">${formatMoney(c.avgSale || 0)}</td>
              <td style="background:${colBg};border:1px solid #CBD5E1;padding:8px;text-align:right;font-weight:bold;color:${colColor};">${formatMoney(c.lastMonthCollection || 0)}</td>
            </tr>
          `;
        })
        .join("");

      const excelHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Customers</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;">
          <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
            <tr>
              <td colspan="8" style="background:#0B2239;color:#FFFFFF;font-size:15pt;font-weight:bold;padding:12px;text-align:center;">
                SONALI TRADING — ${escapeHtml(filterTitle)}
              </td>
            </tr>
            <tr>
              <td colspan="8" style="background:#12334F;color:#F0A63D;font-size:10pt;font-weight:bold;padding:6px 12px;text-align:center;">
                Exported Date: ${dhakaDateKey()} | Total Customers: ${rows.length}
              </td>
            </tr>
            <tr>
              <th style="background:#1769AA;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:50px;">SL</th>
              <th style="background:#1769AA;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:260px;text-align:left;">Customer Name</th>
              <th style="background:#1769AA;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:130px;text-align:left;">Phone</th>
              <th style="background:#1769AA;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:220px;text-align:left;">Address</th>
              <th style="background:#BE123C;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:150px;text-align:right;">Due Amount</th>
              <th style="background:#047857;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:150px;text-align:right;">Advance Payment</th>
              <th style="background:#1D4ED8;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:150px;text-align:right;">Average Sale</th>
              <th style="background:#D97706;color:#FFFFFF;border:1px solid #0B2239;padding:10px;width:170px;text-align:right;">Last Month Collection</th>
            </tr>
            ${tableRowsHtml}
            <tr>
              <td colspan="4" style="background:#0B2239;color:#FFFFFF;border:1px solid #0B2239;padding:10px;text-align:right;font-weight:bold;">TOTAL (${rows.length} Customers)</td>
              <td style="background:#FFE4E6;color:#BE123C;border:1px solid #0B2239;padding:10px;text-align:right;font-weight:bold;">${formatMoney(totalDue)}</td>
              <td style="background:#D1FAE5;color:#047857;border:1px solid #0B2239;padding:10px;text-align:right;font-weight:bold;">${formatMoney(totalAdv)}</td>
              <td style="background:#DBEAFE;color:#1D4ED8;border:1px solid #0B2239;padding:10px;text-align:right;font-weight:bold;">${formatMoney(totalAvgSale)}</td>
              <td style="background:#FEF3C7;color:#B45309;border:1px solid #0B2239;padding:10px;text-align:right;font-weight:bold;">${formatMoney(totalLastCol)}</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(["\uFEFF", excelHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = [category || "all", sub ? sub.replace(/\s+/g, "-") : "", dueOnly ? "due" : ""].filter(Boolean).join("_").toLowerCase();
      a.href = url;
      a.download = `sonali-traders-customers-${slug}-${dhakaDateKey()}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast(`Downloaded Excel sheet (${rows.length} customers)`);
    } catch (e) {
      toast(e.message || "Could not export Excel sheet", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader group={dueOnly ? "Customer / Due Customer" : "Customer / Customer List"} title="Customer management" />
      <main className="page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="page-title">{dueOnly ? "Due Customer" : "Customer List"}</h2>
            <p className="page-subtitle">
              {dueOnly
                ? "Customers who still owe money, highest due first."
                : "Track cement and rod customers with due, advance, average sale and last month collection."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadExcel}
              disabled={exporting}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[.98] disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              {exporting ? "Downloading…" : "Download Excel Sheet"}
              <Download className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </button>

            <button
              onClick={() => setShowDue(!showDue)}
              aria-expanded={showDue}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all ${showDue ? "border-gold-500 bg-gold-500/10 text-gold-600" : "border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgba(11,34,57,0.04)] hover:bg-slate-50"}`}
            >
              <FilePlus2 className="h-4 w-4" aria-hidden /> Add Old Customer Due
              <ChevronDown className={`h-4 w-4 transition-transform ${showDue ? "rotate-180" : ""}`} aria-hidden />
            </button>

            <Link href="/customers/create" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]">
              <Plus className="h-4 w-4" aria-hidden /> Add Customer
            </Link>
          </div>
        </div>

        {showDue && (
          <section className="card animate-fade-in border-gold-500/30">
            <div className="card-header">
              <div>
                <h3 className="card-title">Add Old Customer Due</h3>
                <p className="mt-0.5 text-xs text-slate-500">Record a due from before this software. It is not counted as a sale.</p>
              </div>
              <button onClick={() => setShowDue(false)} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-900"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={saveDue} className="grid items-start gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_2fr_auto]">
              <CustomerPicker value={due.customer} onChange={(c) => setDue({ ...due, customer: c })} error={dueErr.customer} />
              <Input label="Due amount" type="number" min="0" step="0.01" inputMode="decimal" value={due.amount} onChange={(e) => setDue({ ...due, amount: e.target.value })} error={dueErr.amount} />
              <Input label="Date" type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} />
              <Input label="Note (optional)" value={due.note} onChange={(e) => setDue({ ...due, note: e.target.value })} />
              <Button type="submit" variant="gold" loading={dueSaving} className="lg:mt-[22px]">Save due</Button>
            </form>
          </section>
        )}

        <section className="card overflow-visible">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or address" aria-label="Search customers" className="field pl-10" />
            </div>

            {/* Customer Category ও Sub-category Hover Tabs */}
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Customer type">
              <button
                type="button"
                role="tab"
                aria-selected={category === "" && !sub}
                onClick={() => setCategoryFilter("", "")}
                className={`pill ${category === "" && !sub ? "pill-active" : ""}`}
              >
                All Customers
              </button>

              {/* Cement Customers Hover Dropdown */}
              <div className="group relative">
                <button
                  type="button"
                  role="tab"
                  aria-selected={category === "cement"}
                  onClick={() => setCategoryFilter("cement", "")}
                  className={`pill ${category === "cement" ? "pill-active" : ""}`}
                >
                  <span>Cement Customers</span>
                  {category === "cement" && sub && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                      {sub}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180" aria-hidden />
                </button>
                <div className="invisible absolute left-0 top-full z-30 w-56 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                    <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select Cement Sub-Category
                    </p>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("cement", "")}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${category === "cement" && !sub ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      All Cement Customers
                    </button>
                    {cementSubs.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCategoryFilter("cement", item.key)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${category === "cement" && sub.toLowerCase() === item.key.toLowerCase() ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rod Customers Hover Dropdown */}
              <div className="group relative">
                <button
                  type="button"
                  role="tab"
                  aria-selected={category === "rod"}
                  onClick={() => setCategoryFilter("rod", "")}
                  className={`pill ${category === "rod" ? "pill-active" : ""}`}
                >
                  <span>Rod Customers</span>
                  {category === "rod" && sub && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
                      {sub}
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:rotate-180" aria-hidden />
                </button>
                <div className="invisible absolute left-0 top-full z-30 w-56 pt-1.5 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
                    <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select Rod Sub-Category
                    </p>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("rod", "")}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${category === "rod" && !sub ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
                    >
                      All Rod Customers
                    </button>
                    {rodSubs.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCategoryFilter("rod", item.key)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${category === "rod" && sub.toLowerCase() === item.key.toLowerCase() ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <button
                onClick={() => setParam("sort", sortDue ? "" : "due")}
                disabled={dueOnly}
                className={`pill disabled:opacity-50 ${sortDue || dueOnly ? "border-gold-500 bg-gold-500 text-white hover:border-gold-500 hover:text-white" : ""}`}
              >
                Highest due first
              </button>
              <button
                onClick={() => setParam("due", dueOnly ? "" : "1")}
                className={`pill ${dueOnly ? "border-danger bg-danger text-white hover:border-danger hover:text-white" : ""}`}
              >
                Only with due
              </button>
            </div>
          </div>

          {!data ? (
            <div className="space-y-2 p-5">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !data.items.length ? (
            <EmptyState
              icon={Users}
              title={dq || category || sub || dueOnly ? "No customers match" : "No customers yet"}
              hint={dueOnly && !dq ? "Nobody owes money right now." : dq || category || sub ? "Try a different search or sub-category." : "Add your first customer to start recording sales."}
              actionHref={dq || category || sub || dueOnly ? undefined : "/customers/create"}
              actionLabel="Add Customer"
            />
          ) : (
            <div className="table-wrap max-h-[70vh]">
              <table className="w-full min-w-[1120px]">
                <thead>
                  <tr>
                    <th className="th">Customer Name</th>
                    <th className="th">Phone</th>
                    <th className="th">Address</th>
                    <th className="th text-right">Due Amount</th>
                    <th className="th text-right">Advance Payment</th>
                    <th className="th text-right">Average Sale</th>
                    <th className="th text-right">Last Month Collection</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="rows">
                  {data.items.map((c) => (
                    <tr key={c.id}>
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                            {(c.name || "?").slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <Link href={`/customers/${c.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{c.name}</Link>
                            {!!c.tags?.length && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {c.tags.map((t) => (
                                  <Badge key={t} tone={t === "cement" ? "info" : t === "rod" ? "neutral" : "warning"}>
                                    {t === "cement" ? "Cement" : t === "rod" ? "Rod" : t.toUpperCase()}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="td num">{c.phone || "—"}</td>
                      <td className="td max-w-[200px] truncate text-slate-500">{c.address || "—"}</td>
                      <td className="td text-right">
                        {c.due > 0 ? <span className="badge badge-danger num">{formatMoney(c.due)}</span> : <span className="num text-slate-400">{formatMoney(0)}</span>}
                      </td>
                      <td className="td text-right">
                        {c.advance > 0 ? <span className="badge badge-success num">{formatMoney(c.advance)}</span> : <span className="num text-slate-400">{formatMoney(0)}</span>}
                      </td>
                      <td className="td text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {c.avgSale > 0 ? (
                            <span className="badge badge-info num">{formatMoney(c.avgSale)}</span>
                          ) : (
                            <span className="num text-slate-400">{formatMoney(0)}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => openMetricsModal(c)}
                            title="Set / Edit Average Sale & Last Month Collection"
                            aria-label={`Edit metrics for ${c.name}`}
                            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="td text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {c.lastMonthCollection > 0 ? (
                            <span className="badge badge-warning num">{formatMoney(c.lastMonthCollection)}</span>
                          ) : (
                            <span className="num text-slate-400">{formatMoney(0)}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => openMetricsModal(c)}
                            title="Add / Edit Last Month Collection"
                            aria-label={`Edit collection for ${c.name}`}
                            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="td whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link href={`/customers/${c.id}`} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50">
                            View Ledger <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                          <Link href={`/customers/${c.id}/edit`} aria-label={`Edit ${c.name}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
        </section>
      </main>

      {/* Average Sale & Last Month Collection Edit Modal */}
      <Modal
        open={!!editingMetrics}
        onClose={() => !metricsSaving && setEditingMetrics(null)}
        title={editingMetrics ? `Update Sale & Collection — ${editingMetrics.name}` : ""}
      >
        {editingMetrics && (
          <form onSubmit={saveMetrics} className="space-y-4">
            <div>
              <Input
                label="Average Sale (৳)"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Leave blank for auto-calculation"
                value={editingMetrics.avgSale}
                onChange={(e) => setEditingMetrics({ ...editingMetrics, avgSale: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Auto-calculated from ledger: <b className="num">{formatMoney(editingMetrics.computedAvgSale)}</b> (Clear field to use auto value)
              </p>
            </div>
            <div>
              <Input
                label="Last Month Collection (৳)"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Enter last month collection amount"
                value={editingMetrics.lastMonthCollection}
                onChange={(e) => setEditingMetrics({ ...editingMetrics, lastMonthCollection: e.target.value })}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Auto-calculated from last month ledger: <b className="num">{formatMoney(editingMetrics.computedLastMonthCol)}</b> (Clear field to use auto value)
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" disabled={metricsSaving} onClick={() => setEditingMetrics(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={metricsSaving}>
                Save
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete customer?"
        message={deleting ? `${deleting.name} will be removed. A customer with a due or advance balance can't be deleted, and one with ledger history is archived so records stay correct.` : ""}
      />
    </>
  );
}