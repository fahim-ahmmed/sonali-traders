"use client";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

export default function AddCategoryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ category: "", brand: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // {id, category, brand}
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/categories").then((r) => r.json()).then((j) => j.ok ? setItems(j.data) : toast(j.error, "error"));
  }, [toast]);
  useEffect(load, [load]);

  function check(v) {
    const e = {};
    if (!v.category.trim()) e.category = "Category name is required";
    if (!v.brand.trim()) e.brand = "Brand name is required";
    return e;
  }

  async function save(e) {
    e.preventDefault();
    if (saving) return;
    const er = check(form); setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then((r) => r.json());
    setSaving(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Category saved");
    setForm({ category: form.category, brand: "" }); // একই category-তে পরপর ব্র্যান্ড যোগ সহজ
    load();
  }

  async function update() {
    const er = check(editing);
    if (Object.keys(er).length) return toast(Object.values(er)[0], "error");
    setBusy(true);
    const res = await fetch(`/api/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: editing.category, brand: editing.brand }) }).then((r) => r.json());
    setBusy(false);
    if (!res.ok) return toast(res.error, "error");
    toast("Category updated"); setEditing(null); load();
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" }).then((r) => r.json());
    setBusy(false);
    setDeleting(null);
    if (!res.ok) return toast(res.error, "error");
    toast("Category deleted"); load();
  }

  return (
    <>
      <PageHeader group="Product / Category" title="Product management" />
      <main className="page">
        <div>
          <h2 className="page-title">Category &amp; Brand</h2>
          <p className="page-subtitle">Every product belongs to one category–brand pair, e.g. Rod — BSRM.</p>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <section className="card lg:col-span-2">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-inset ring-brand-600/10"><Tags className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h3 className="text-base font-semibold text-navy-900">Add Category</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Create product categories and brands.</p>
                </div>
              </div>
            </div>
            <form onSubmit={save} className="space-y-4 p-5">
              <Input label="Category name" name="category" placeholder="e.g. Rod" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} error={errors.category} />
              <Input label="Brand name" name="brand" placeholder="e.g. BSRM" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} error={errors.brand} />
              <Button type="submit" loading={saving} className="w-full"><Plus className="h-4 w-4" aria-hidden /> Save category</Button>
              <p className="text-xs text-slate-500">Tip: the category stays filled after saving, so you can add several brands in a row.</p>
            </form>
          </section>

          <section className="card overflow-hidden lg:col-span-3">
            <div className="card-header">
              <h3 className="card-title text-base">Category List</h3>
              {items && <span className="badge badge-neutral num">{items.length} total</span>}
            </div>
            {!items ? <div className="space-y-2 p-5"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              : !items.length ? <EmptyState icon={Tags} title="No categories yet" hint="Add your first category and brand using the form." />
              : (
                <div className="table-wrap max-h-[65vh]">
                  <table className="w-full">
                    <thead><tr><th className="th">Category</th><th className="th">Brand</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody className="rows">
                      {items.map((c) => (
                        <tr key={c.id}>
                          <td className="td"><span className={`badge ${String(c.category).toUpperCase() === "ROD" ? "badge-neutral" : "badge-warning"}`}>{c.category}</span></td>
                          <td className="td font-medium text-navy-900">{c.brand}</td>
                          <td className="td text-right">
                            <div className="inline-flex gap-1.5">
                              <button onClick={() => setEditing({ ...c })} aria-label={`Edit ${c.category} ${c.brand}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setDeleting(c)} aria-label={`Delete ${c.category} ${c.brand}`} title="Delete" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        </div>
      </main>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit category">
        {editing && (
          <div className="space-y-4">
            <Input label="Category name" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <Input label="Brand name" value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} />
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button loading={busy} onClick={update}>Save changes</Button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy}
        title="Delete category?" message={deleting ? `${deleting.category} — ${deleting.brand} will be removed. Categories used by products can't be deleted.` : ""} />
    </>
  );
}
