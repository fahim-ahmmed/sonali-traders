"use client";
import { useEffect, useState } from "react";

// শুধু প্রথম লোডে সূক্ষ্ম count-up; reduced-motion হলে সরাসরি মান
export default function CountUp({ value, format = (n) => String(Math.round(n)) }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !value) { setV(value); return; }
    let raf; const t0 = performance.now(), dur = 600;
    const tick = (t) => { const p = Math.min((t - t0) / dur, 1); setV(value * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(v)}</>;
}
