"use client";

import { useState } from "react";
import { t } from "../../../lib/i18n";

/** One "Үнэн / Худал" card: tap an answer, see whether it was right and why. */
export default function TrueFalseCard({ statement, answer, explain, onAnswered, nextLabel = t("Дараах", "Next") }) {
  const [picked, setPicked] = useState(null);
  const correct = picked != null && picked === answer;
  return (
    <div className="space-y-4">
      <p className="rounded-3xl bb-bg-FDE7F1-50 p-5 text-center text-lg font-black leading-snug text-slate-800">«{statement}»</p>
      <div className="grid grid-cols-2 gap-2">
        {[[true, t("Үнэн ✅", "True ✅")], [false, t("Худал ❌", "False ❌")]].map(([value, label]) => {
          const chosen = picked === value;
          const tone = picked == null ? "border-slate-100 bg-white text-slate-700"
            : value === answer ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : chosen ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-100 bg-white text-slate-400";
          return (
            <button key={String(value)} type="button" disabled={picked != null} onClick={() => setPicked(value)} aria-pressed={chosen}
              className={`min-h-14 rounded-2xl border-2 text-base font-extrabold transition ${tone}`}>{label}</button>
          );
        })}
      </div>
      {picked != null && (
        <div className="space-y-3">
          <p className={`rounded-2xl p-3 text-sm font-bold leading-relaxed ${correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
            {correct ? `${t("Зөв!", "Correct!")} ` : `${t("Зөв хариулт:", "Correct answer:")} ${answer ? t("Үнэн", "True") : t("Худал", "False")}. `}{explain}
          </p>
          {onAnswered && <button type="button" onClick={() => { onAnswered(correct); setPicked(null); }} className="w-full rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">{nextLabel}</button>}
        </div>
      )}
    </div>
  );
}
