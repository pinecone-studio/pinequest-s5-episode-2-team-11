"use client";

import { X } from "lucide-react";

export default function BottomSheet({ title, onClose, children, className = "" }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`bloom-pop max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bb-bg-FFF7FB px-4 pt-2 ${className}`}
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Хаах" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-100 bg-white text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
