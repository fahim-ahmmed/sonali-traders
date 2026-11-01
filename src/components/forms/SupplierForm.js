"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

export default function SupplierForm({ supplierId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [f, setF] = useState({ name: "", company: "", address: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [loaded, setLoaded] = useState(!supplierId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supplierId) return;
    fetch(`/api/suppliers/${supplierId}`).then((r) => r.json()).then((j) => {
      if (!j.ok) { toast(j.error, "error"); return router.replace("/suppliers"); }
      const { name, company, address, phone } = j.data;
      setF({ name, company, address, phone }); setLoaded(true);
    });
  }, [supplierId, router, toast]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const er = {};
    if (!f.name.trim()) er.name = "Supplier name is required";
    if (f.phone && !/^01\d{9}$/.test(f.phone)) er.phone = "Phone must look like 01XXXXXXXXX (11 digits)";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const res = await fetch(supplierId ? `/api/suppliers/${supplierId}` : "/api/suppliers", {
      method: supplierId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    }).then((r) => r.json());
    if (!res.ok) { toast(res.error, "error"); setSaving(false); return; }
    toast(supplierId ? "Supplier updated" : "Supplier saved");
    router.push("/suppliers"); router.refresh();
  }

  if (!loaded) return <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-24" /></div>;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Supplier name" name="name" placeholder="Enter supplier name" value={f.name} onChange={set("name")} error={errors.name} />
        <Input label="Supplier company name" name="company" placeholder="Enter company name" value={f.company} onChange={set("company")} />
      </div>
      <Textarea label="Address" name="address" placeholder="Enter complete supplier address" value={f.address} onChange={set("address")} />
      <Input label="Phone number" name="phone" inputMode="numeric" placeholder="e.g. 01XXXXXXXXX" value={f.phone} onChange={set("phone")} error={errors.phone} className="sm:max-w-xs" />
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Link href="/suppliers" className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cancel</Link>
        <Button type="submit" loading={saving}>{supplierId ? "Update supplier" : "Save supplier"}</Button>
      </div>
    </form>
  );
}
