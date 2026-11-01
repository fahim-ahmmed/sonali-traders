"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

export default function CustomerForm({ customerId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [loaded, setLoaded] = useState(!customerId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customerId) return;
    fetch(`/api/customers/${customerId}`).then((r) => r.json()).then((j) => {
      if (!j.ok) { toast(j.error, "error"); return router.replace("/customers"); }
      const { name, phone, address } = j.data.customer;
      setF({ name, phone, address }); setLoaded(true);
    });
  }, [customerId, router, toast]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const er = {};
    if (!f.name.trim()) er.name = "Customer name is required";
    if (f.phone && !/^01\d{9}$/.test(f.phone)) er.phone = "Phone must look like 01XXXXXXXXX (11 digits)";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const res = await fetch(customerId ? `/api/customers/${customerId}` : "/api/customers", {
      method: customerId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    }).then((r) => r.json());
    if (!res.ok) { toast(res.error, "error"); setSaving(false); return; }
    toast(customerId ? "Customer updated" : "Customer saved");
    if (res.data?.warning) toast(res.data.warning, "error");
    router.push("/customers"); router.refresh();
  }

  if (!loaded) return <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-24" /></div>;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Customer name" name="name" placeholder="e.g. Mohona Traders (Holcim Cement)" value={f.name} onChange={set("name")} error={errors.name} />
        <Input label="Phone number" name="phone" inputMode="numeric" placeholder="01XXXXXXXXX" value={f.phone} onChange={set("phone")} error={errors.phone} />
      </div>
      <Textarea label="Address" name="address" value={f.address} onChange={set("address")} />
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Link href="/customers" className="inline-flex min-h-[40px] items-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-200">Cancel</Link>
        <Button type="submit" loading={saving}>{customerId ? "Update customer" : "Save customer"}</Button>
      </div>
    </form>
  );
}
