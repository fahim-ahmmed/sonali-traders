"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card w-full max-w-md p-5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// সব ডিলিটে এটি ব্যবহার হবে
export function ConfirmDialog({ open, onClose, onConfirm, title = "Are you sure?", message, confirmText = "Delete", loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-5 text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
