"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input, { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import PermissionPicker from "./PermissionPicker";
import { toPaisa, toTaka } from "@/lib/money";

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return ["Too short", "Weak", "Fair", "Good", "Strong"][p.length < 8 ? 0 : Math.max(s, 1)];
}

export default function StaffForm({ staffId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [f, setF] = useState({ name: "", designation: "", phone: "", salary: "", address: "", email: "", password: "" });
  const [perms, setPerms] = useState([]);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (staffId) {
      fetch(`/api/staff/${staffId}`).then((r) => r.json()).then((j) => {
        if (!j.ok) { toast(j.error, "error"); return router.replace("/staff"); }
        const s = j.data.staff;
        setF({ name: s.name, designation: s.designation, phone: s.phone, salary: s.salary ? String(toTaka(s.salary)) : "", address: s.address, email: s.email, password: "" });
        setPerms(s.permissions); setLoaded(true);
      });
    } else {
      fetch("/api/settings/roles").then((r) => r.json()).then((j) => { if (j.ok) setPerms(j.data.staffDefault); setLoaded(true); });
    }
  }, [staffId, router, toast]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;
    const er = {};
    if (!f.name.trim()) er.name = "Staff name is required";
    if (f.phone && !/^01\d{9}$/.test(f.phone)) er.phone = "Phone must look like 01XXXXXXXXX";
    if (f.salary !== "" && Number(f.salary) < 0) er.salary = "Salary can't be negative";
    if (!staffId) {
      if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email";
      if (f.password.length < 8) er.password = "Password must be at least 8 characters";
    }
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const body = { name: f.name, designation: f.designation, phone: f.phone, salary: toPaisa(f.salary), address: f.address, permissions: perms,
      ...(staffId ? {} : { email: f.email, password: f.password }) };
    const res = await fetch(staffId ? `/api/staff/${staffId}` : "/api/staff", { method: staffId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
    if (!res.ok) { toast(res.error, "error"); setSaving(false); return; }
    toast(staffId ? "Staff updated" : "Staff account created");
    router.push("/staff"); router.refresh();
  }

  async function resetPassword() {
    if (newPw.length < 8) return toast("Password must be at least 8 characters", "error");
    setResetting(true);
    const res = await fetch(`/api/staff/${staffId}/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: newPw }) }).then((r) => r.json());
    setResetting(false);
    if (!res.ok) return toast(res.error, "error");
    setNewPw(""); toast("Password reset. The staff member has been signed out.");
  }

  if (!loaded) return <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-28" /></div>;
  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Staff name" value={f.name} onChange={set("name")} error={errors.name} />
          <Input label="Designation" placeholder="e.g. Sales Officer" value={f.designation} onChange={set("designation")} />
          <Input label="Phone number" inputMode="numeric" value={f.phone} onChange={set("phone")} error={errors.phone} />
          <Input label="Salary" type="number" min="0" step="0.01" inputMode="decimal" value={f.salary} onChange={set("salary")} error={errors.salary} />
        </div>
        <Textarea label="Address" value={f.address} onChange={set("address")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email ID (login)" type="email" autoComplete="off" value={f.email} onChange={set("email")} error={errors.email} disabled={!!staffId} />
          {!staffId && (
            <div className="relative">
              <Input label="Password" type={show ? "text" : "password"} autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password}
                hint={f.password ? `Strength: ${strength(f.password)}` : "At least 8 characters"} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-8 text-slate-500">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          )}
        </div>
        <PermissionPicker value={perms} onChange={setPerms} />
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Link href="/staff" className="inline-flex min-h-[40px] items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">Cancel</Link>
          <Button type="submit" loading={saving}>{staffId ? "Update staff" : "Create staff account"}</Button>
        </div>
      </form>

      {staffId && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2 text-sm font-bold text-navy-900">Reset password</h3>
          <div className="flex flex-wrap items-end gap-3">
            <Input label="New password" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full sm:max-w-xs" />
            <Button type="button" variant="gold" loading={resetting} onClick={resetPassword}>Reset password</Button>
          </div>
        </div>
      )}
    </>
  );
}
