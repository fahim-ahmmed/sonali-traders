"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ImageIcon, Upload } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import FormCard from "@/components/layout/FormCard";
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
      <main className="page">
        <FormCard title="General Settings" subtitle="Manage your company identity and contact information." icon={Building2}>
          {!form ? (
            <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-24" /></div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <span className="field-label">Company logo</span>
                <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
                    {preview ? <img src={preview} alt="Logo preview" className="max-h-full max-w-full object-contain p-1.5" /> : <ImageIcon className="h-7 w-7 text-slate-300" aria-hidden />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(11,34,57,0.04)] transition-colors focus-within:ring-2 focus-within:ring-brand-600 hover:bg-slate-50">
                      <Upload className="h-4 w-4" aria-hidden /> {preview ? "Change logo" : "Upload logo"}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onFile} className="sr-only" />
                    </label>
                    <p className="mt-2 text-xs text-slate-500">PNG, JPG, WEBP or SVG. Max 2MB. Applies across the system.</p>
                  </div>
                </div>
                {errors.logo && <p className="field-error">{errors.logo}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Company name" name="companyName" value={form.companyName} onChange={set("companyName")} error={errors.companyName} required />
                <Input label="Company phone number" name="phone" value={form.phone} onChange={set("phone")} />
              </div>
              <Input label="Hot line" name="hotline" value={form.hotline} onChange={set("hotline")} className="sm:max-w-xs" />
              <Textarea label="Address" name="address" value={form.address} onChange={set("address")} />
              <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" loading={saving}>Save company settings</Button></div>
            </form>
          )}
        </FormCard>
      </main>
    </>
  );
}
