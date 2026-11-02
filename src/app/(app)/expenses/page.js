"use client";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Receipt, Trash2, X } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input, { Select } from "@/components/ui/Input";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { dhakaDateKey, formatDate } from "@/lib/dates";
import { formatMoney, toPaisa, toTaka } from "@/lib/money";

export default function ExpensesPage() {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [payers, setPayers] = useState([]);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [range, setRange] = useState({ from: "", to: "" });
  const [f, setF] = useState({ paidById: "", date: dhakaDateKey(), amount: "", purpose: "", note: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/expenses/payers").then((r) => r.json()).then((j) => { if (j.ok) { setIsAdmin(true); setPayers(j.data); } }); // স্টাফ হলে 403 → শুধু নিজের
  }, []);

  const load = useCallback(() => {
    const p = new URLSearchParams({ page, limit: 25 });
    if (range.from) p.set("from", range.from);
    if (range.to) p.set("to", range.to);
    fetch(`/api/expenses?${p}`).then((r) => r.json()).then((j) => j.ok ? setData(j.data) : toast(j.error, "error"));
  }, [page, range, toast]);
  useEffect(load, [load]);

  function check(v) {
    const e = {};
    if (!(Number(v.amount) > 0)) e.amount = "Enter an amount more than 0";
    if (!v.purpose.trim()) e.purpose = "Tell us what the expense was for";
    if (!v.date) e.date = "Choose a date";
    return e;
  }
  const body = (v) => ({ date: v.date, amount: toPaisa(v.amount), purpose: v.purpose, note: v.note, paidById: v.paidById || undefined });

  async function save(e) {
    e.preventDefault();
    if (saving) return;
    const er = check(f); setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const res = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body(f)) }).then((r) => r.json());
    setSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Expense saved");
    setF({ ...f, amount: "", purpose: "", note: "" });
    setPage(1); load();
  }

  async function update() {
    const er = check(editing);
    if (Object.keys(er).length) return toast(Object.values(er)[0], "error");
    setBusy(true);
    const res = await fetch(`/api/expenses/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body(editing)) }).then((r) => r.json());
    setBusy(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Expense updated"); setEditing(null); load();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/expenses/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false); setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast("Expense archived"); load();
  }

  const admins = payers.filter((p) => p.role === "admin"), staff = payers.filter((p) => p.role === "staff");

  return (
    <>
      <PageHeader group="Expenses" title="Business expenses" />
      <main className="page">
        <div>
          <h2 className="page-title">Expenses</h2>
          <p className="page-subtitle">Record business expenses by staff or administrator.</p>
        </div>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-50 to-amber-100 text-orange-600 ring-1 ring-inset ring-orange-600/10"><Receipt className="h-5 w-5" aria-hidden /></span>
              <div>
                <h3 className="text-base font-semibold text-navy-900">Add Expense</h3>
                <p className="mt-0.5 text-xs text-slate-500">It shows up in today&apos;s dashboard, reports and accounts.</p>
              </div>
            </div>
          </div>
          <form onSubmit={save} className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {isAdmin && (
                <Select label="Paid by" value={f.paidById} onChange={(e) => setF({ ...f, paidById: e.target.value })}>
                  <option value="">Me</option>
                  {admins.length > 0 && <optgroup label="Admin">{admins.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>}
                  {staff.length > 0 && <optgroup label="Staff">{staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>}
                </Select>
              )}
              <Input label="Expense date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} error={errors.date} />
              <Input label="Amount" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} error={errors.amount} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input label="What was the expense for?" list="purposes" placeholder="Transport, office supplies, repair…" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} error={errors.purpose} />
                <datalist id="purposes">{(data?.purposes || []).map((p) => <option key={p} value={p} />)}</datalist>
              </div>
              <Input label="Note (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={saving} className="w-full sm:w-auto"><Plus className="h-4 w-4" aria-hidden /> Save Expense</Button>
            </div>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <h3 className="card-title text-base">Expense History</h3>
              {data && <span className="badge badge-danger num">{formatMoney(data.totalAmount)}</span>}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <Input label="From" type="date" value={range.from} onChange={(e) => { setRange({ ...range, from: e.target.value }); setPage(1); }} />
              <Input label="To" type="date" value={range.to} onChange={(e) => { setRange({ ...range, to: e.target.value }); setPage(1); }} />
              {(range.from || range.to) && <Button variant="ghost" onClick={() => { setRange({ from: "", to: "" }); setPage(1); }}><X className="h-4 w-4" aria-hidden /> Clear</Button>}
            </div>
          </div>
          {!data ? <div className="space-y-2 p-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
            : !data.items.length ? <EmptyState icon={Receipt} title="No expenses recorded yet" hint="Saved expenses will appear here." />
            : (
              <div className="table-wrap max-h-[65vh]">
                <table className="w-full min-w-[720px]">
                  <thead><tr><th className="th">Date</th><th className="th">Paid By</th><th className="th">Expense For</th><th className="th">Note</th><th className="th text-right">Amount</th>{isAdmin && <th className="th text-right">Actions</th>}</tr></thead>
                  <tbody className="rows">
                    {data.items.map((x) => (
                      <tr key={x.id}>
                        <td className="td num whitespace-nowrap text-slate-500">{formatDate(x.date)}</td>
                        <td className="td">
                          <span className="inline-flex items-center gap-2">
                            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{(x.paidByName || "?").slice(0, 2).toUpperCase()}</span>
                            {x.paidByName}
                          </span>
                        </td>
                        <td className="td font-semibold text-navy-900">{x.purpose}</td>
                        <td className="td text-slate-500">{x.note || "—"}</td>
                        <td className="td num text-right font-semibold text-navy-900">{formatMoney(x.amount)}</td>
                        {isAdmin && <td className="td whitespace-nowrap text-right">
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => setEditing({ ...x, date: dhakaDateKey(new Date(x.date)), amount: String(toTaka(x.amount)) })} aria-label="Edit expense" title="Edit"
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleting(x)} aria-label="Delete expense" title="Delete"
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-50"><td className="td font-semibold text-navy-900" colSpan={4}>Total{range.from || range.to ? " (selected dates)" : ""}</td><td className="td num text-right font-bold text-navy-900">{formatMoney(data.totalAmount)}</td>{isAdmin && <td />}</tr></tfoot>
                </table>
              </div>
            )}
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
        </section>
      </main>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit expense">
        {editing && (
          <div className="space-y-4">
            <Select label="Paid by" value={editing.paidById} onChange={(e) => setEditing({ ...editing, paidById: e.target.value })}>
              {admins.length > 0 && <optgroup label="Admin">{admins.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>}
              {staff.length > 0 && <optgroup label="Staff">{staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>}
            </Select>
            <Input label="Date" type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            <Input label="Amount" type="number" min="0" step="0.01" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
            <Input label="Expense for" value={editing.purpose} onChange={(e) => setEditing({ ...editing, purpose: e.target.value })} />
            <Input label="Note" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button loading={busy} onClick={update}>Save changes</Button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title="Archive expense?" message={deleting ? `${deleting.purpose} — ${formatMoney(deleting.amount)} will be excluded from active reports. Its record will be retained.` : ""} />
    </>
  );
}
