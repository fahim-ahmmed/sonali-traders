"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as Icons from "lucide-react";
import { ChevronDown, LogOut, Menu, ShoppingCart, X } from "lucide-react";
import { MENU, can } from "@/lib/permissions";
import { authClient } from "@/lib/auth-client";

function Item({ item, pathname, pending, sp, onNavigate }) {
  const Icon = Icons[item.icon] || Icons.Circle;
  const hasChildren = !!item.children;
  const childActive = hasChildren && item.children.some((c) => pathname.startsWith(c.href.split("?")[0]));
  const [open, setOpen] = useState(childActive);
  const active = item.href && pathname.startsWith(item.href);

  const base = "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150";
  const state = active
    ? "bg-navy-800 font-medium text-white shadow-inner shadow-black/10"
    : childActive
      ? "font-medium text-white hover:bg-navy-800/60"
      : "text-slate-300 hover:bg-navy-800/60 hover:text-white";
  const iconCls = `h-[18px] w-[18px] shrink-0 transition-colors ${active || childActive ? "text-gold-500" : "text-slate-400 group-hover:text-slate-200"}`;

  if (!hasChildren) {
    return (
      <Link href={item.href} onClick={onNavigate} className={`${base} ${state}`} aria-current={active ? "page" : undefined}>
        <Icon className={iconCls} aria-hidden />
        <span className="flex-1">{item.label}</span>
        {item.badge === "pending" && pending > 0 && (
          <span className="num animate-pulse rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-950" aria-label={`${pending} pending`}>
            {pending}
          </span>
        )}
      </Link>
    );
  }
  return (
    <div>
      <button onClick={() => setOpen(!open)} className={`${base} ${state}`} aria-expanded={open}>
        <Icon className={iconCls} aria-hidden />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 pl-2.5">
          {item.children.map((c) => {
            const [b, qs] = c.href.split("?");
            // Due Customer (?due=1) ও Customer List আলাদাভাবে হাইলাইট
            const on = qs ? pathname === b && sp.get("due") === "1" : pathname === b && !(b === "/customers" && sp.get("due") === "1");
            return (
              <Link
                key={c.href}
                href={c.href}
                onClick={onNavigate}
                aria-current={on ? "page" : undefined}
                className={`block rounded-r-lg py-2 text-[13px] transition-colors duration-150 ${
                  on ? "border-l-[3px] border-gold-500 bg-white/[.04] pl-3 font-medium text-amber-400" : "border-l-[3px] border-transparent pl-3 text-slate-400 hover:text-white"
                }`}
              >
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
  const allowed = MENU.filter((m) => can(user, m.perm));
  const shortcut = allowed.find((m) => m.shortcut);
  const items = allowed.filter((m) => !m.shortcut);
  const close = () => setMobile(false);

  async function logout() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  const panel = (
    <aside className="relative flex h-full w-64 flex-col overflow-hidden border-r border-white/10 bg-navy-900 text-slate-200">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand-600/20 blur-3xl" aria-hidden />

      {/* লোগো + স্ট্যাটাস */}
      <div className="relative flex items-center gap-3 px-5 pb-4 pt-5">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1" />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 text-base font-bold text-white shadow-lg shadow-gold-500/25">
            {company.companyName.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-white">{company.companyName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success shadow-[0_0_6px_#1F9D63]" />
            </span>
            Online · Rod &amp; Cement
          </p>
        </div>
      </div>

      {/* POS শর্টকাট */}
      {shortcut && (
        <div className="relative px-4 pb-3">
          <Link
            href={shortcut.href}
            onClick={close}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-[.98]"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
            POS
          </Link>
        </div>
      )}

      <p className="relative px-6 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">Menu</p>
      <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]" aria-label="Main menu">
        {items.map((it) => <Item key={it.label} item={it} pathname={pathname} pending={pending} sp={sp} onNavigate={close} />)}
      </nav>

      {/* প্রোফাইল কার্ড */}
      <div className="relative border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-md">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
            {(user.name || "U").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-[11px] text-slate-400">{user.role === "admin" ? "Administrator" : "Staff"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
        </button>
        <p className="mt-1 text-center text-[10px] text-slate-500">Developed By Bengal Tech Hub Solution</p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="no-print z-40 hidden md:fixed md:inset-y-0 md:left-0 md:block">{panel}</div>
      <button
        onClick={() => setMobile(true)}
        aria-label="Open menu"
        className="no-print fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-navy-900 text-white shadow-lg md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={close} />
          <div className="relative h-full w-64 animate-fade-in">
            {panel}
            <button onClick={close} aria-label="Close menu" className="absolute -right-11 top-3 grid h-9 w-9 place-items-center rounded-xl bg-navy-900 text-white shadow-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
