"use client";
import { AlertTriangle, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Error({ reset }) {
  return (
    <main className="grid min-h-[60vh] place-items-center p-8">
      <div className="card max-w-md animate-scale-in p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50"><AlertTriangle className="h-6 w-6" aria-hidden /></span>
        <h1 className="mt-5 text-lg font-semibold text-navy-900">Something went wrong</h1>
        <p className="mt-1 text-sm text-slate-500">This page couldn&apos;t load. Your data is safe. Please try again.</p>
        <Button onClick={reset} className="mt-6"><RotateCcw className="h-4 w-4" aria-hidden /> Try again</Button>
      </div>
    </main>
  );
}
