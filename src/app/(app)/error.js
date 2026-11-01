"use client";
import Button from "@/components/ui/Button";

export default function Error({ reset }) {
  return (
    <main className="grid min-h-[60vh] place-items-center p-8">
      <div className="card max-w-md p-8 text-center">
        <h1 className="text-lg font-bold text-navy-900">Something went wrong</h1>
        <p className="mt-1 text-sm text-slate-500">This page couldn&apos;t load. Your data is safe. Please try again.</p>
        <Button onClick={reset} className="mt-5">Try again</Button>
      </div>
    </main>
  );
}
