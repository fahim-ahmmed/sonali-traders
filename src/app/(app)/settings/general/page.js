"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

export default function GeneralSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((j) => {
      if (!j.ok) return toast(j.error, "error");
      setForm({ companyName: j.data.companyName || "", phone: j.data.phone || "", hotline: j.data.hotline || "", address: j.data.address || "" });
      setPreview(j.data.logoUrl || "");
    });
  }, [toast]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const okType = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(f.type);
    if (!okType) return setErrors({ logo: "Logo must be PNG, JPG, WEBP or SVG" });
    if (f.size > 2 * 1024 * 1024) return setErrors({ logo: "Logo must be 2MB or smaller" });
    setErrors({});
    setFile(f);
    setPreview(URL.createObjectURL(f)); // লাইভ প্রিভিউ
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then((r) => r.json());
    if (!res.ok) { setErrors({ companyName: res.error }); setSaving(false); return; }
    if (file) {
      const fd = new FormData();
      fd.append("logo", file);
      const lr = await fetch("/api/settings/logo", { method: "POST", body: fd }).then((r) => r.json());
      if (!lr.ok) { setErrors({ logo: lr.error }); setSaving(false); return; }
      setFile(null);
    }
    toast("Company settings saved");
    setSaving(false);
    router.refresh(); // সাইডবারে নতুন লোগো/নাম
  }

  return (
    <>
      <PageHeader group="Settings / General Settings" title="Company preferences" />
      <main className="p-5 sm:p-8">
        <div className="card max-w-2xl p-6">
          <h2 className="text-lg font-bold text-navy-900">General Settings</h2>
          <p className="mb-5 text-sm text-slate-500">Manage your company identity and contact information.</p>
          {!form ? (
            <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-24" /></div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Company name" name="companyName" value={form.companyName} onChange={set("companyName")} error={errors.companyName} required />
                <Input label="Company phone number" name="phone" value={form.phone} onChange={set("phone")} />
              </div>
              <Input label="Hot line" name="hotline" value={form.hotline} onChange={set("hotline")} className="sm:max-w-xs" />
              <Textarea label="Address" name="address" value={form.address} onChange={set("address")} />
              <div>
                <span className="field-label">Company logo</span>
                <div className="flex items-center gap-4 rounded-lg border border-dashed border-slate-300 p-4">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg bg-slate-100">
                    {preview ? <img src={preview} alt="Logo preview" className="max-h-full max-w-full object-contain" /> : <span className="text-[10px] text-slate-400">No logo</span>}
                  </div>
                  <div>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onFile} className="text-sm" />
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP or SVG. Max 2MB. Applies across the system.</p>
                  </div>
                </div>
                {errors.logo && <p className="field-error">{errors.logo}</p>}
              </div>
              <div className="flex justify-end"><Button type="submit" loading={saving}>Save company settings</Button></div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
