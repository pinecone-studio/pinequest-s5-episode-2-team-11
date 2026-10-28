"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { askAi } from "../../../lib/ai-client";
import { addDaysToLocalDateKey, getCyclePosition, localDateKey } from "../../../lib/cycle";
import {
  LOG_MORE_HINT, SEASON_TEXT, tipLabel, forecastTitle, prepTipFor, safetyLines, statsForPosition, templateForecast, validateForecast,
} from "../../../lib/forecast";
import { LOG_ENTRIES_CHANGED, dayLogsFromEntries, fetchEntries } from "../../../lib/log-entries";
import { supabase } from "../../../lib/supabase";
import { useFamily } from "../../../context/FamilyContext";
import { t } from "../../../lib/i18n";
import { useLang } from "../../../context/LanguageContext";

const AI_TIMEOUT_MS = 5000; // server gives the AI 3 s; this covers the round trip
const TRANSIENT_ERRORS = new Set(["timeout", "network_error"]);

const normalizePeriods = (periods) => (periods ?? [])
  .map((period) => typeof period === "string" ? { startDate: period, duration: null } : { startDate: period.startDate ?? period.log_date, duration: period.duration ?? null })
  .filter((period) => period.startDate);

/**
 * Хувийн мөчлөгийн таамаг — зөвхөн охинд, мөчлөгийн өдөр бүр. Өмнөх
 * мөчлөгүүдийн ижил өдөр (эсвэл улирлын) бүртгэлээс тооцоолсон статистикийг
 * (нэр, огноо, id, тэмдэглэлгүй) AI руу илгээж, хариуг мөчлөг × өдрөөр кэшлэнэ.
 */
export default function CyclePredictionCard() {
  const { view, profile, session, cyclePeriods, cycleLength } = useFamily();
  const today = localDateKey(new Date());
  const periods = useMemo(() => normalizePeriods(cyclePeriods), [cyclePeriods]);
  const position = useMemo(() => getCyclePosition(today, cyclePeriods ?? [], { cycleLength }), [today, cyclePeriods, cycleLength]);
  const inCycle = position.phase === "cycle";
  const [logs, setLogs] = useState(null);
  const [forecast, setForecast] = useState(null);
  const requestedRef = useRef("");

  // 3 completed cycles + the current one; autumn windows never reach before the oldest start.
  const from = useMemo(() => {
    const oldest = periods.map((period) => period.startDate).sort().slice(-4)[0];
    return oldest ? addDaysToLocalDateKey(oldest, -1) : today;
  }, [periods, today]);

  // Reads log_entries (mood, symptoms/pain, skin → acne, sleep). Note text is never in there.
  useEffect(() => {
    if (view !== "daughter" || !inCycle || !supabase || !profile?.id) return;
    let cancelled = false;
    const load = () => fetchEntries(supabase, from, today).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[forecast] log entries:", error.message);
      setLogs(dayLogsFromEntries(data).map(({ log_date, mood, pain, symptoms, sleepHours }) => ({ log_date, mood, pain, symptoms, sleepHours })));
    });
    load();
    // Today's card is keyed by cycle day + cached, so new logs today never regenerate it.
    window.addEventListener(LOG_ENTRIES_CHANGED, load);
    return () => { cancelled = true; window.removeEventListener(LOG_ENTRIES_CHANGED, load); };
  }, [view, inCycle, profile?.id, from, today]);

  const rawStats = useMemo(() => (inCycle && logs ? statsForPosition(position, periods, logs) : null), [inCycle, position, periods, logs]);
  // Same numbers → same object, so a refetch after today's logging never restarts the request.
  const statsJson = rawStats ? JSON.stringify(rawStats) : "";
  const stats = useMemo(() => (statsJson ? JSON.parse(statsJson) : null), [statsJson]);
  const { lang } = useLang();
  const safety = useMemo(() => (inCycle && logs ? safetyLines(periods, logs, position.cycleStart) : []), [inCycle, logs, periods, position, lang]);

  useEffect(() => {
    if (!stats || !inCycle || !profile?.id) return;
    const cycleStart = position.cycleStart;
    // One text per cycle day: new logs during the day never regenerate it.
    const key = `${cycleStart}:${stats.dayLabel}:${lang}`;
    if (requestedRef.current === key) return;
    requestedRef.current = key;
    // AI болон кэш зөвхөн монгол текст гаргадаг — англи хэлэнд орчуулсан загвар текстийг шууд харуулна
    if (lang === "en") {
      setForecast(templateForecast(stats));
      return () => { requestedRef.current = ""; };
    }
    setForecast(null);
    let cancelled = false;

    (async () => {
      const cached = await supabase.from("forecast_cache").select("text, tip")
        .eq("user_id", profile.id).eq("cycle_start", cycleStart).eq("day_label", stats.dayLabel).maybeSingle();
      if (cached.error) console.warn("[forecast] cache read:", cached.error.message);
      if (cached.data) {
        if (!cancelled) setForecast(cached.data);
        return;
      }

      let result = null;
      let source = "template";
      let transient = typeof navigator !== "undefined" && navigator.onLine === false;
      if (!transient) {
        // The request body is exactly { type, stats } — see lib/forecast.ts ForecastStats.
        const response = await askAi(session, { type: "cycle_forecast", stats }, AI_TIMEOUT_MS, { detailed: true });
        result = validateForecast(response, stats);
        if (result) source = "ai";
        else if (TRANSIENT_ERRORS.has(response?.error)) transient = true;
      }
      result ??= templateForecast(stats);
      if (!cancelled) setForecast(result);
      // Offline results are not cached so the AI gets a chance once she is back online.
      if (transient) return;
      const { error } = await supabase.from("forecast_cache").upsert({
        user_id: profile.id, cycle_start: cycleStart, day_label: stats.dayLabel, text: result.text, tip: result.tip, source,
      });
      if (error) console.warn("[forecast] cache write:", error.message);
    })().catch((error) => {
      console.error("[forecast]", error);
      if (!cancelled) setForecast(templateForecast(stats));
    });

    return () => {
      cancelled = true;
      requestedRef.current = "";
    };
  }, [stats, inCycle, position, profile?.id, session, lang]);

  if (view !== "daughter") return null;

  // Level 3 (no usable history) and before the first period use local text only.
  const local = !inCycle ? prepTipFor(today) : logs && !stats ? SEASON_TEXT[position.season] : null;
  const loading = inCycle && (!logs || (stats && !forecast));
  return (
    <section className="rounded-3xl border border-pink-200 bg-white p-4 shadow-sm bloom-fade">
      <h2 className="font-black text-slate-700">{forecastTitle(position)}</h2>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> {t("Өмнөх бүртгэлээ харж байна…", "Looking at your past logs…")}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {local ? (
            <>
              <p className="text-sm font-bold leading-relaxed text-slate-700">{local}</p>
              {inCycle && <p className="text-xs font-semibold text-slate-400">{t(LOG_MORE_HINT, "🌱 The more you log, the better your tips will fit you")}</p>}
            </>
          ) : (
            <>
              <p className="text-sm font-bold leading-relaxed text-slate-700">{forecast.text}</p>
              <span className="inline-block rounded-full bb-bg-FDE7F1 px-3 py-1 text-xs font-extrabold bb-text-B83B7E">{tipLabel(forecast.tip)}</span>
            </>
          )}
          {safety.map((line) => <p key={line} className="rounded-2xl bb-bg-FDE7F1-50 p-3 text-sm font-bold leading-relaxed bb-text-B83B7E">{line}</p>)}
        </div>
      )}

      <p className="mt-3 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-400">
        {t("🔒 Зөвхөн чамд харагдана", "🔒 Only you can see this")}{stats ? t(` · Өмнөх ${stats.cyclesUsed} мөчлөгөөс`, ` · From your last ${stats.cyclesUsed} cycles`) : ""}
      </p>
    </section>
  );
}
