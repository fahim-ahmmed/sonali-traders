export default function Loading() {
  return (
    <div className="p-5 sm:p-8" aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-6 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}</div>
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-200" />
    </div>
  );
}
