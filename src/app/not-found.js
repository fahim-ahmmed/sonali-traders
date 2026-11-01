import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(23,105,170,.08),transparent_60%)]" aria-hidden />
      <div className="card relative max-w-md animate-scale-in p-10 text-center">
        <p className="num bg-gradient-to-r from-navy-900 to-gold-500 bg-clip-text text-6xl font-bold tracking-tight text-transparent">404</p>
        <h1 className="mt-3 text-lg font-semibold text-navy-900">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500">The page you are looking for doesn&apos;t exist or was moved.</p>
        <Link href="/dashboard" className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition-all hover:shadow-md active:scale-[.98]">Back to dashboard</Link>
      </div>
    </main>
  );
}
