"use client";
import NotificationBell from "./NotificationBell";

export default function PageHeader({ group, title, children }) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-white/10 bg-gradient-to-r from-navy-900 via-navy-800 to-gold-500 px-4 py-3.5 text-white shadow-md sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 pl-11 md:pl-0">
        <div className="min-w-0">
          {group && <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-gold-400">{group}</p>}
          <h1 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {children}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}