import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-8">
      <div className="card max-w-md p-8 text-center">
        <p className="text-4xl font-bold text-gold-500">404</p>
        <h1 className="mt-2 text-lg font-bold text-navy-900">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500">The page you are looking for doesn&apos;t exist or was moved.</p>
        <Link href="/dashboard" className="mt-5 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Back to dashboard</Link>
      </div>
    </main>
  );
}
