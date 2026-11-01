"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as Icons from "lucide-react";
import { ChevronDown, ChevronRight, LogOut, Menu, X } from "lucide-react";
import { MENU, can } from "@/lib/permissions";
import { authClient } from "@/lib/auth-client";

function Item({ item, pathname, pending, sp }) {
  const Icon = Icons[item.icon] || Icons.Circle;
  const hasChildren = !!item.children;
  const childActive = hasChildren && item.children.some((c) => pathname.startsWith(c.href.split("?")[0]));
  const [open, setOpen] = useState(childActive);
  const active = item.href && pathname.startsWith(item.href);

  const base = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150";
  const state = active || (childActive && !open)
    ? "bg-brand-600/25 text-white border-l-[3px] border-gold-500"
    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent";

  if (!hasChildren) {
    return (
      <Link href={item.href} className={`${base} ${state}`}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1">{item.label}</span>
        {item.badge === "pending" && pending > 0 && (
          <span className="rounded-full bg-warning px-2 py-0.5 text-[11px] font-bold text-navy-900">{pending}</span>
        )}
      </Link>
    );
  }
  return (
    <div>
      <button onClick={() => setOpen(!open)} className={`${base} ${state}`} aria-expanded={open}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map((c) => {
            const [base, qs] = c.href.split("?");
            // Due Customer (?due=1) ও Customer List আলাদাভাবে হাইলাইট
            const on = qs ? pathname === base && sp.get("due") === "1" : pathname === base && !(base === "/customers" && sp.get("due") === "1");
            return (
              <Link key={c.href} href={c.href}
                className={`block rounded-md border-l-2 px-3 py-2 text-[13px] transition-colors duration-150 ${on ? "border-gold-500 bg-brand-600/25 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ user, company, pending = 0 }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [mobile, setMobile] = useState(false);
  const items = MENU.filter((m) => can(user, m.perm));

  async function logout() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  const panel = (
    <aside className="flex h-full w-64 flex-col bg-navy-900">
      <div className="flex items-center justify-center border-b border-white/10 px-4 py-4">
        {company.logoUrl
          ? <img src={company.logoUrl} alt={company.companyName} className="max-h-16 w-auto rounded-md bg-white p-1" />
          : <div className="text-center"><p className="text-lg font-bold text-white">{company.companyName}</p><p className="text-[11px] text-gold-500">Rod &amp; Cement</p></div>}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main menu">
        {items.map((it) => <Item key={it.label} item={it} pathname={pathname} pending={pending} sp={sp} />)}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 px-1">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-500 text-xs font-bold text-white">
            {(user.name || "U").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-[11px] text-slate-400">{user.role === "admin" ? "Administrator" : "Staff"}</p>
          </div>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <p className="mt-2 px-1 text-[10px] text-slate-500">Developed By Bengal Tech Hub Solution</p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="no-print hidden md:block md:fixed md:inset-y-0 md:left-0 z-30">{panel}</div>
      <button onClick={() => setMobile(true)} aria-label="Open menu"
        className="no-print fixed left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-lg bg-navy-900 text-white md:hidden">
        <Menu className="h-5 w-5" />
      </button>
      {mobile && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobile(false)} />
          <div className="relative h-full w-64">
            {panel}
            <button onClick={() => setMobile(false)} aria-label="Close menu" className="absolute -right-10 top-3 grid h-9 w-9 place-items-center rounded-lg bg-navy-900 text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
