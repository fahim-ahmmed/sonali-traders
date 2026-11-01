import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function NoAccess() {
  return (
    <main className="grid min-h-[70vh] place-items-center p-8">
      <div className="card max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-warning" aria-hidden />
        <h1 className="mt-3 text-lg font-bold text-navy-900">You don&apos;t have access to this page</h1>
        <p className="mt-1 text-sm text-slate-500">Ask an administrator to update your permissions.</p>
        <Link href="/pos" className="mt-5 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Go to POS</Link>
      </div>
    </main>
  );
}
