"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import { t } from "../../../lib/i18n";
import { CYCLE_PHASE_FOOTER, CYCLE_PHASE_LIST } from "../../../lib/cyclePhases";

export default function CycleLegend({ compact = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={compact ? "flex items-start gap-2" : undefined}>
        {compact && <ul aria-label={t("Мөчлөгийн үеүүд", "Cycle phases")} className="grid min-w-0 flex-1 list-none grid-cols-2 gap-2 p-0">
          {CYCLE_PHASE_LIST.map((phase) => (
            <li key={phase.label} className="flex min-w-0 items-center gap-1.5 rounded-xl bb-bg-FFF7FB px-2 py-2">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: phase.color }} />
              <span className="min-w-0 text-[11px] font-extrabold leading-tight text-slate-700">{phase.emoji} {phase.shortLabel}</span>
            </li>
          ))}
        </ul>}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("Мөчлөгийн үеийн тайлбар", "Cycle phase information")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bb-bg-FDE7F1 bb-text-B83B7E focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-500"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {open && <BottomSheet title={t("Мөчлөгийн 4 үе 🌸", "The 4 cycle phases 🌸")} onClose={() => setOpen(false)} focusTrap>
        <div className="space-y-3 pb-2">
          {CYCLE_PHASE_LIST.map((phase) => (
            <article key={phase.label} className="rounded-2xl bb-bg-FFF7FB p-3">
              <h3 className="mb-1 text-sm font-extrabold text-slate-700">{phase.emoji} {phase.label}</h3>
              <p className="text-sm font-semibold leading-relaxed text-slate-600">{phase.description}</p>
            </article>
          ))}
          <p className="pb-1 text-center text-xs font-bold leading-relaxed text-slate-500">{t(CYCLE_PHASE_FOOTER, "Everyone's body is different. You may not feel all these things, and that's normal.")}</p>
        </div>
      </BottomSheet>}
    </>
  );
}