"use client";
import { useCallback, useEffect, useState } from "react";
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
      <main className="space-y-6 p-5 sm:p-8">
        <div className="card max-w-3xl p-6">
          <h2 className="text-lg font-bold text-navy-900">Add Category</h2>
          <p className="mb-5 text-sm text-slate-500">Create product categories and brands.</p>
          <form onSubmit={save} className="grid items-start gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <Input label="Category name" name="category" placeholder="e.g. Rod" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} error={errors.category} />
            <Input label="Brand name" name="brand" placeholder="e.g. BSRM" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} error={errors.brand} />
            <Button type="submit" loading={saving} className="sm:mt-5">Save category</Button>
          </form>
        </div>

        <div className="card max-w-3xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-base font-bold text-navy-900">Category List</h2>
            {items && <span className="text-xs text-slate-500">{items.length} total</span>}
          </div>
          {!items ? <div className="space-y-2 p-5"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            : !items.length ? <EmptyState title="No categories yet" hint="Add your first category and brand above." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr><th className="th">Category</th><th className="th">Brand</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="td font-semibold">{c.category}</td>
                        <td className="td">{c.brand}</td>
                        <td className="td text-right">
                          <button onClick={() => setEditing({ ...c })} className="mr-2 rounded-md bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">Edit</button>
                          <button onClick={() => setDeleting(c)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-danger hover:bg-red-100">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
