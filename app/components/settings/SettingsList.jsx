"use client";

import { ChevronRight } from "lucide-react";
import { t } from "../../../lib/i18n";

/** Grouped list (iOS Settings style): muted small-caps header + rounded card of rows. */
export function SettingsGroup({ id, title, children, className = "" }) {
  return (
    <section id={id} className={`scroll-mt-20 ${className}`}>
      {title && <h3 className="mb-1.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</h3>}
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">{children}</div>
    </section>
  );
}

/** One compact row: emoji, label, optional value on the right, chevron. */
export function SettingsRow({ emoji, label, value, onClick, disabled = false, chevron = true, right = null }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-left transition active:bg-slate-50 disabled:opacity-60"
    >
      <span aria-hidden="true" className="w-6 shrink-0 text-center text-lg">{emoji}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-700">{label}</span>
      {value && <span className="max-w-[40%] shrink-0 truncate text-xs font-bold text-slate-400">{value}</span>}
      {right}
      {chevron && !disabled && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
    </button>
  );
}

export function Toggle({ label, hint, checked, onChange, disabled = false }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-left disabled:opacity-60">
      <span className="min-w-0 text-sm font-extrabold text-slate-700">
        {label}
        {hint && <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">{hint}</span>}
      </span>
      <span className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${checked ? "bb-bg-E0679F" : "bg-slate-200"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

export function ComingSoon({ text = null }) {
  return <p className="rounded-2xl bb-bg-E9DDFC-50 p-4 text-center text-sm font-bold bb-text-7C4DCC">{text ?? t("Удахгүй нэмэгдэнэ 🌱", "Coming soon 🌱")}</p>;
}
