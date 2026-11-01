"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

const ToastCtx = createContext({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, message, type }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`flex animate-scale-in items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-card-hover ${t.type === "error" ? "border-rose-200 bg-white text-rose-700" : "border-emerald-200 bg-white text-emerald-700"}`}>
            <span className={`grid h-6 w-6 place-items-center rounded-full ${t.type === "error" ? "bg-rose-50" : "bg-emerald-50"}`}>
              {t.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </span>
            <span className="text-slate-700">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
