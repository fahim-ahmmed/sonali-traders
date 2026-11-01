import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function NoAccess() {
  return (
    <main className="grid min-h-[70vh] place-items-center p-8">
      <div className="card max-w-md animate-scale-in p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-500 ring-8 ring-amber-50/50"><ShieldAlert className="h-6 w-6" aria-hidden /></span>
        <h1 className="mt-5 text-lg font-semibold text-navy-900">You don&apos;t have access to this page</h1>
        <p className="mt-1 text-sm text-slate-500">Ask an administrator to update your permissions.</p>
        <Link href="/pos" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]">Go to POS</Link>
      </div>
    </main>
  );
}
