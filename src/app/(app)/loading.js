export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-[68px] bg-gradient-to-r from-navy-900 via-navy-800 to-gold-500 opacity-90" />
      <div className="page">
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-slate-200/70" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-200/50" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />)}</div>
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}
