"use client";
import { useCallback, useEffect, useState } from "react";
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
    toast("Expense deleted"); load();
  }

  const admins = payers.filter((p) => p.role === "admin"), staff = payers.filter((p) => p.role === "staff");

  return (
    <>
      <PageHeader group="Expenses" title="Business expenses" />
      <main className="space-y-6 p-5 sm:p-8">
        <div className="card max-w-4xl p-6">
          <h2 className="text-lg font-bold text-navy-900">Add Expense</h2>
          <p className="mb-4 text-sm text-slate-500">Record business expenses by staff or administrator.</p>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {isAdmin && (
                <Select label="Paid by" value={f.paidById} onChange={(e) => setF({ ...f, paidById: e.target.value })}>
                  <option value="">Me</option>
                  {admins.length > 0 && <optgroup label="Admin">{admins.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>}
                  {staff.length > 0 && <optgroup label="Staff">{staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>}
                </Select>
              )}
              <Input label="Expense date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} error={errors.date} />
              <Input label="Amount" type="number" min="0" step="0.01" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} error={errors.amount} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input label="What was the expense for?" list="purposes" placeholder="Transport, office supplies, repair…" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} error={errors.purpose} />
                <datalist id="purposes">{(data?.purposes || []).map((p) => <option key={p} value={p} />)}</datalist>
              </div>
              <Input label="Note (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            </div>
            <Button type="submit" loading={saving} className="w-full sm:w-auto">Save Expense</Button>
          </form>
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 p-5">
            <h2 className="text-base font-bold text-navy-900">Expense History</h2>
            <div className="flex flex-wrap items-end gap-3">
              <Input label="From" type="date" value={range.from} onChange={(e) => { setRange({ ...range, from: e.target.value }); setPage(1); }} />
              <Input label="To" type="date" value={range.to} onChange={(e) => { setRange({ ...range, to: e.target.value }); setPage(1); }} />
            </div>
          </div>
          {!data ? <div className="space-y-2 p-5"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            : !data.items.length ? <EmptyState title="No expenses recorded yet" hint="Saved expenses will appear here." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead><tr><th className="th">Date</th><th className="th">Paid by</th><th className="th">Expense for</th><th className="th">Note</th><th className="th text-right">Amount</th>{isAdmin && <th className="th text-right">Actions</th>}</tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.items.map((x) => (
                      <tr key={x.id} className="hover:bg-slate-50">
                        <td className="td whitespace-nowrap">{formatDate(x.date)}</td><td className="td">{x.paidByName}</td><td className="td font-semibold">{x.purpose}</td><td className="td text-slate-500">{x.note || "—"}</td>
                        <td className="td text-right font-semibold">{formatMoney(x.amount)}</td>
                        {isAdmin && <td className="td whitespace-nowrap text-right">
                          <button onClick={() => setEditing({ ...x, date: dhakaDateKey(new Date(x.date)), amount: String(toTaka(x.amount)) })} className="mr-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Edit</button>
                          <button onClick={() => setDeleting(x)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100">Delete</button></td>}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="bg-slate-50"><td className="td font-bold" colSpan={4}>Total{range.from || range.to ? " (selected dates)" : ""}</td><td className="td text-right font-bold">{formatMoney(data.totalAmount)}</td>{isAdmin && <td />}</tr></tfoot>
                </table>
              </div>
            )}
          {data && <Pagination page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
        </div>
      </main>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit expense">
        {editing && (
          <div className="space-y-3">
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
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title="Delete expense?" message={deleting ? `${deleting.purpose} — ${formatMoney(deleting.amount)} will be removed from all reports.` : ""} />
    </>
  );
}
