"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, HandCoins, MapPin, Pencil, Phone, Plus, Printer, ReceiptText, ShoppingCart, Trash2, UserRound, Wallet } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { Badge, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey, formatDate } from "@/lib/dates";
import { formatMoney, toPaisa, toTaka } from "@/lib/money";

const TYPE = { sale: ["Sale", "info"], payment: ["Due Payment", "success"], opening_due: ["Opening Due", "warning"], advance: ["Advance", "success"] };

export default function CustomerLedgerPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [d, setD] = useState(null);
  const [company, setCompany] = useState(null);
  const [pay, setPay] = useState({ amount: "", date: dhakaDateKey(), note: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [due, setDue] = useState({ amount: "", date: dhakaDateKey(), note: "" });
  const [dueErr, setDueErr] = useState("");
  const [savingDue, setSavingDue] = useState(false);

  // Edit ও Delete স্টেট
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [entryBusy, setEntryBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/customers/${id}`);
      const result = await response.json();
      if (result.ok) setD(result.data);
      else toast(result.error, "error");
    } catch {
      toast("Could not load this customer ledger. Check your connection and try again.", "error");
    }
  }, [id, toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/settings").then((r) => r.json()).then((j) => j.ok && setCompany(j.data)); }, []);

  async function receive(e) {
    e.preventDefault();
    if (saving) return;
    if (!(toPaisa(pay.amount) > 0)) return setErr("Enter an amount more than 0");
    setErr(""); setSaving(true);
    try {
      const response = await fetch(`/api/customers/${id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: toPaisa(pay.amount), date: pay.date, note: pay.note }) });
      const result = await response.json();
      if (!result.ok) return toast(result.error, "error");
      toast("Payment saved");
      setPay({ amount: "", date: dhakaDateKey(), note: "" });
      await load();
    } catch {
      toast("Could not save payment. Check your connection and try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function addDue(e) {
    e.preventDefault();
    if (savingDue) return;
    if (!(toPaisa(due.amount) > 0)) return setDueErr("Enter a due amount more than 0");
    setDueErr(""); setSavingDue(true);
    try {
      const response = await fetch("/api/customers/opening-due", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: id, amount: toPaisa(due.amount), date: due.date, note: due.note }) });
      const result = await response.json();
      if (!result.ok) return toast(result.error, "error");
      toast("Due added to customer ledger");
      setDue({ amount: "", date: dhakaDateKey(), note: "" });
      await load();
    } catch {
      toast("Could not add due. Check your connection and try again.", "error");
    } finally {
      setSavingDue(false);
    }
  }

  function openEditModal(entry) {
    setEditingEntry({
      id: entry.id,
      type: entry.type,
      date: dhakaDateKey(new Date(entry.date)),
      debit: entry.total ? String(toTaka(entry.total)) : "0",
      credit: entry.received ? String(toTaka(entry.received)) : "0",
      description: entry.description || "",
      note: entry.note || "",
    });
  }

  async function saveEditedEntry(e) {
    e.preventDefault();
    if (entryBusy || !editingEntry) return;
    const debitP = toPaisa(editingEntry.debit);
    const creditP = toPaisa(editingEntry.credit);
    if (debitP <= 0 && creditP <= 0) {
      return toast("Enter an amount greater than 0", "error");
    }
    setEntryBusy(true);
    try {
      const res = await fetch(`/api/customers/${id}/ledger/${editingEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editingEntry.date,
          debit: debitP,
          credit: creditP,
          description: editingEntry.description,
          note: editingEntry.note,
        }),
      }).then((r) => r.json());
      if (!res.ok) return toast(res.error, "error");
      toast("Ledger entry updated");
      setEditingEntry(null);
      await load();
    } catch {
      toast("Could not update ledger entry.", "error");
    } finally {
      setEntryBusy(false);
    }
  }

  async function confirmDeleteEntry() {
    if (entryBusy || !deletingEntry) return;
    setEntryBusy(true);
    try {
      const res = await fetch(`/api/customers/${id}/ledger/${deletingEntry.id}`, {
        method: "DELETE",
      }).then((r) => r.json());
      if (!res.ok) return toast(res.error, "error");
      toast("Ledger entry deleted and balance recalculated");
      setDeletingEntry(null);
      await load();
    } catch {
      toast("Could not delete ledger entry.", "error");
    } finally {
      setEntryBusy(false);
    }
  }

  const c = d?.customer;
  const s = d?.summary;
  const cards = s ? [
    { l: "Customer Name", v: c.name, icon: UserRound, tone: "text-navy-900", ring: "bg-brand-50 text-brand-600", text: true },
    { l: "Total Purchases", v: formatMoney(s.totalPurchases), icon: ShoppingCart, tone: "text-navy-900", ring: "bg-slate-100 text-slate-600" },
    { l: "Total Payments", v: formatMoney(s.totalPayments), icon: Wallet, tone: "text-navy-900", ring: "bg-slate-100 text-slate-600" },
    { l: "Current Due", v: formatMoney(s.due), icon: ReceiptText, tone: s.due > 0 ? "text-rose-600" : "text-slate-400", ring: "bg-rose-50 text-rose-600", accent: s.due > 0 ? "bg-danger" : "" },
    { l: "Available Advance", v: formatMoney(s.advance), icon: BadgeCheck, tone: s.advance > 0 ? "text-emerald-600" : "text-slate-400", ring: "bg-emerald-50 text-emerald-600", accent: s.advance > 0 ? "bg-success" : "" },
  ] : [];

  return (
    <>
      <PageHeader group="Customer / Ledger" title="Customer management" />
      <main className="page">
        <div className="no-print flex items-center justify-between gap-3">
          <Link href="/customers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-600">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Customer List
          </Link>
        </div>

        {/* শুধু প্রিন্টে দেখা যায় */}
        <div className="print-only mb-4 border-b border-slate-300 pb-3">
          <div className="flex items-center gap-3">
            {company?.logoUrl && <img src={company.logoUrl} alt="" className="h-14 w-auto" />}
            <div>
              <p className="text-lg font-bold">{company?.companyName || "Sonali Trading"}</p>
              <p className="text-xs">{[company?.address, company?.phone && `Phone: ${company.phone}`, company?.hotline && `Hotline: ${company.hotline}`].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold">Customer Ledger — printed {formatDate(new Date())}</p>
        </div>

        {!d ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* কাস্টমার হেডার */}
            <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 text-lg font-bold text-white shadow-lg shadow-navy-900/20">
                  {(c.name || "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-bold tracking-tight text-navy-900">{c.name}</h2>
                    {s.due === 0 && s.advance === 0 && <Badge tone="success">All settled</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="num inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" aria-hidden />{c.phone || "No phone"}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden />{c.address || "No address"}</span>
                  </div>
                </div>
              </div>
              <div className="no-print flex gap-2">
                <Link href={`/customers/${id}/edit`} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  <Pencil className="h-4 w-4" aria-hidden /> Edit
                </Link>
                <Button onClick={() => window.print()} disabled={!d}><Printer className="h-4 w-4" aria-hidden /> Print Ledger</Button>
              </div>
            </section>

            {/* সামারি কার্ড */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map(({ l, v, icon: Icon, tone, ring, text, accent }) => (
                <div key={l} className="card relative overflow-hidden p-4">
                  {accent && <span className={`absolute inset-x-0 top-0 h-1 ${accent}`} aria-hidden />}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{l}</p>
                    <span className={`no-print grid h-8 w-8 place-items-center rounded-lg ${ring}`}><Icon className="h-4 w-4" aria-hidden /></span>
                  </div>
                  <p className={`mt-2 truncate font-bold ${text ? "text-base" : "num text-xl"} ${tone}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* পেমেন্ট গ্রহণ */}
            <form onSubmit={receive} className={`card no-print overflow-hidden ${s.due > 0 ? "border-emerald-200" : ""}`}>
              <div className="card-header">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><HandCoins className="h-4 w-4" aria-hidden /></span>
                  <div>
                    <h3 className="card-title">Receive Due Payment</h3>
                    <p className="text-xs text-slate-500">{s.due > 0 ? <>Outstanding due: <b className="num text-rose-600">{formatMoney(s.due)}</b></> : "No due right now — any payment is kept as advance."}</p>
                  </div>
                </div>
              </div>
              <div className="grid items-start gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
                <Input label="Payment amount" type="number" min="0" step="0.01" inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} error={err} />
                <Input label="Date" type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} />
                <Input label="Payment note" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
                <Button type="submit" loading={saving} variant="success" className="lg:mt-[22px]">Save payment</Button>
              </div>
              <p className="px-5 pb-4 text-xs text-slate-500">Paying more than the due is kept as the customer&apos;s advance.</p>
            </form>

            <form onSubmit={addDue} className="card no-print overflow-hidden">
              <div className="card-header">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700"><Plus className="h-4 w-4" aria-hidden /></span>
                  <div>
                    <h3 className="card-title">Add New Due / Previous Due</h3>
                    <p className="text-xs text-slate-500">Adds a debit entry and increases this customer&apos;s outstanding balance.</p>
                  </div>
                </div>
              </div>
              <div className="grid items-start gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
                <Input label="Due amount" type="number" min="0.01" step="0.01" inputMode="decimal" value={due.amount} onChange={(e) => setDue({ ...due, amount: e.target.value })} error={dueErr} />
                <Input label="Date" type="date" value={due.date} onChange={(e) => setDue({ ...due, date: e.target.value })} />
                <Input label="Note" value={due.note} onChange={(e) => setDue({ ...due, note: e.target.value })} />
                <Button type="submit" loading={savingDue} className="lg:mt-[22px]">Add due</Button>
              </div>
            </form>

            {/* লেজার */}
            <section className="card overflow-hidden">
              <div className="card-header">
                <h3 className="card-title text-base">Purchase &amp; Due Ledger</h3>
                <span className="badge badge-neutral num">{d.entries.length} entries</span>
              </div>
              {!d.entries.length ? <EmptyState icon={ReceiptText} title="No ledger entries found yet" hint="Sales, payments and old dues will appear here." /> : (
                <div className="table-wrap print-expand max-h-[70vh]">
                  <table className="w-full min-w-[960px]">
                    <thead><tr>
                      <th className="th">Date</th><th className="th">Type</th><th className="th">Description</th><th className="th text-right">Quantity</th>
                      <th className="th text-right">Total</th><th className="th text-right">Paid / Received</th><th className="th text-right">Balance Due</th><th className="th">Note</th>
                      <th className="th no-print text-right">Actions</th>
                    </tr></thead>
                    <tbody className="rows">
                      {d.entries.map((e) => (
                        <tr key={e.id}>
                          <td className="td num whitespace-nowrap text-slate-500">{formatDate(e.date)}</td>
                          <td className="td"><Badge tone={TYPE[e.type]?.[1] || "neutral"}>{TYPE[e.type]?.[0] || e.type}</Badge></td>
                          <td className="td text-navy-900">{e.description}</td>
                          <td className="td num text-right">{e.qty || "—"}</td>
                          <td className="td num text-right">{e.total ? formatMoney(e.total) : "—"}</td>
                          <td className="td num text-right font-medium text-emerald-600">{e.received ? formatMoney(e.received) : "—"}</td>
                          <td className={`td num text-right font-semibold ${e.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>{e.balance < 0 ? `${formatMoney(-e.balance)} adv.` : formatMoney(e.balance)}</td>
                          <td className="td text-slate-500">{e.note || "—"}</td>
                          <td className="td no-print whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(e)}
                                aria-label="Edit ledger entry"
                                title="Edit entry"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingEntry(e)}
                                aria-label="Delete ledger entry"
                                title="Delete entry"
                                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                              >
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
            </section>
          </>
        )}
      </main>

      {/* Ledger Entry Edit Modal */}
      <Modal open={!!editingEntry} onClose={() => !entryBusy && setEditingEntry(null)} title="Edit Ledger Entry">
        {editingEntry && (
          <form onSubmit={saveEditedEntry} className="space-y-4">
            <Input
              label="Date"
              type="date"
              value={editingEntry.date}
              onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
              required
            />
            {(editingEntry.type === "sale" || editingEntry.type === "opening_due") && (
              <Input
                label={editingEntry.type === "sale" ? "Total Sale Amount (৳)" : "Due Amount (৳)"}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={editingEntry.debit}
                onChange={(e) => setEditingEntry({ ...editingEntry, debit: e.target.value })}
              />
            )}
            {(editingEntry.type === "sale" || editingEntry.type === "payment" || editingEntry.type === "advance") && (
              <Input
                label="Paid / Received Amount (৳)"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={editingEntry.credit}
                onChange={(e) => setEditingEntry({ ...editingEntry, credit: e.target.value })}
              />
            )}
            <Input
              label="Description"
              value={editingEntry.description}
              onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
            />
            <Input
              label="Note (optional)"
              value={editingEntry.note}
              onChange={(e) => setEditingEntry({ ...editingEntry, note: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" disabled={entryBusy} onClick={() => setEditingEntry(null)}>Cancel</Button>
              <Button type="submit" loading={entryBusy}>Save changes</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Ledger Entry Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingEntry}
        onClose={() => !entryBusy && setDeletingEntry(null)}
        onConfirm={confirmDeleteEntry}
        loading={entryBusy}
        confirmText="Delete Entry"
        title="Delete this ledger entry?"
        message={
          deletingEntry
            ? `${deletingEntry.description || TYPE[deletingEntry.type]?.[0] || "This entry"} will be permanently removed and the customer's balance will be recalculated automatically.${deletingEntry.type === "sale" ? " Product stock from this sale will also be restored." : ""}`
            : ""
        }
      />
    </>
  );
}