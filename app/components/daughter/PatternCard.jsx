"use client";

import { useEffect, useMemo, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { addDaysToLocalDateKey, localDateKey } from "../../../lib/cycle";
import { LOG_ENTRIES_CHANGED, MOODS, SKIN, SYMPTOM_ITEMS, dayLogsFromEntries, fetchEntries } from "../../../lib/log-entries";
import { seasonPatterns } from "../../../lib/patterns";
import { supabase } from "../../../lib/supabase";
import Card from "../ui/Card";
import { t } from "../../../lib/i18n";
import { CYCLE_PHASES, SEASON_PHASE_KEYS } from "../../../lib/cyclePhases";

const label = (pairs, key) => pairs.find(([value]) => value === key)?.[1] ?? key;
const moodOf = (average) => MOODS.find((option) => option.value === Math.round(average));

/** "Чиний хэв маяг" — season by season, from her own log entries. Daughter only. */
export default function PatternCard() {
  const { view, profile, cyclePeriods } = useFamily();
  const today = localDateKey(new Date());
  const periods = useMemo(() => (cyclePeriods ?? [])
    .map((period) => (typeof period === "string" ? { startDate: period } : { startDate: period.startDate ?? period.log_date, duration: period.duration ?? null }))
    .filter((period) => period.startDate), [cyclePeriods]);
  const [logs, setLogs] = useState(null);

  const from = useMemo(() => {
    const oldest = periods.map((period) => period.startDate).sort().slice(-4)[0];
    return oldest ?? addDaysToLocalDateKey(today, -1);
  }, [periods, today]);

  useEffect(() => {
    if (view !== "daughter" || !supabase || !profile?.id) return undefined;
    let cancelled = false;
    const load = () => fetchEntries(supabase, from, today).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[patterns] log entries:", error.message);
      setLogs(dayLogsFromEntries(data));
    });
    load();
    window.addEventListener(LOG_ENTRIES_CHANGED, load);
    return () => { cancelled = true; window.removeEventListener(LOG_ENTRIES_CHANGED, load); };
  }, [view, profile?.id, from, today]);

  const pattern = useMemo(() => (logs ? seasonPatterns(periods, logs, today) : null), [logs, periods, today]);
  if (view !== "daughter") return null;

  return (
    <Card className="!p-4">
      <h2 className="font-black text-slate-700">{t("✨ Чиний хэв маяг", "✨ Your patterns")}</h2>
      {!pattern ? (
        <p className="mt-2 text-sm font-bold text-slate-400">{t("Ачаалж байна…", "Loading…")}</p>
      ) : !pattern.seasons.length ? (
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{t("Нэг бүтэн мөчлөг тэмдэглэвэл чиний үе бүрийн хэв маяг энд гарна 🌱", "Log one full cycle and your patterns for each phase will show here 🌱")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {pattern.seasons.map((season) => {
            const mood = season.avgMood != null ? moodOf(season.avgMood) : null;
            const chips = [
              mood && `${mood.emoji} ${mood.label}`,
              ...season.topSymptoms.map((item) => `⚡ ${label(SYMPTOM_ITEMS, item)}`),
              ...season.topSkin.map((item) => `🧴 ${label(SKIN, item)}`),
              season.avgSleep != null && t(`😴 ${season.avgSleep} цаг`, `😴 ${season.avgSleep} h`),
            ].filter(Boolean);
            return (
              <li key={season.season} className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-600">
                  {CYCLE_PHASES[SEASON_PHASE_KEYS[season.season]].emoji} {CYCLE_PHASES[SEASON_PHASE_KEYS[season.season]].label}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {chips.length ? chips.map((chip) => <span key={chip} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-600">{chip}</span>)
                    : <span className="text-[11px] font-semibold text-slate-400">{t("Онцгой зүйл тэмдэглэгдээгүй", "Nothing special logged")}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-400">
        {t("🔒 Зөвхөн чамд харагдана", "🔒 Only you can see this")}{pattern?.cyclesUsed ? t(` · Өмнөх ${pattern.cyclesUsed} мөчлөгөөс`, ` · From your last ${pattern.cyclesUsed} cycles`) : ""}
      </p>
    </Card>
  );
}
