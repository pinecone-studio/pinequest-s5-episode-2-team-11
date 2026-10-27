"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { askAi } from "../../../lib/ai-client";
import { addDaysToLocalDateKey, localDateKey } from "../../../lib/cycle";
import { pickForecastTarget, safetyLines, statsForTarget, templateForecast, validateForecast } from "../../../lib/forecast";
import { supabase } from "../../../lib/supabase";
import { useFamily } from "../../../context/FamilyContext";

const AI_TIMEOUT_MS = 5000; // server gives the AI 3 s; this covers the round trip
const TRANSIENT_ERRORS = new Set(["timeout", "network_error"]);

const normalizePeriods = (periods) => (periods ?? [])
  .map((period) => typeof period === "string" ? { startDate: period, duration: null } : { startDate: period.startDate ?? period.log_date, duration: period.duration ?? null })
  .filter((period) => period.startDate);

/**
 * Хувийн мөчлөгийн таамаг — зөвхөн охинд. Өмнөх мөчлөгүүдийн ижил үеийн
 * бүртгэлээс тооцоолсон статистикийг (нэр, огноо, id, тэмдэглэлгүй) AI руу
 * илгээж, хариуг мөчлөг × өдрийн шошгоор кэшлэнэ.
 */
export default function CyclePredictionCard() {
  const { view, profile, session, cyclePeriods, periodPrediction } = useFamily();
  const today = localDateKey(new Date());
  const periods = useMemo(() => normalizePeriods(cyclePeriods), [cyclePeriods]);
  const [logs, setLogs] = useState(null);
  const [forecast, setForecast] = useState(null);
  const requestedRef = useRef("");

  const from = useMemo(() => {
    const oldest = periods.map((period) => period.startDate).sort().slice(-4)[0];
    const floor = addDaysToLocalDateKey(today, -120);
    return oldest ? [addDaysToLocalDateKey(oldest, -6), floor].sort()[0] : floor;
  }, [periods, today]);

  useEffect(() => {
    if (view !== "daughter" || !supabase || !profile?.id) return;
    let cancelled = false;
    supabase.rpc("get_my_day_logs", { p_from: from, p_to: today }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[forecast] day logs:", error.message);
      // Only categorical fields are kept; note text never enters the forecast.
      setLogs((data ?? []).map(({ log_date, mood, pain, symptoms }) => ({ log_date, mood, pain, symptoms })));
    });
    return () => { cancelled = true; };
  }, [view, profile?.id, from, today]);

  const target = useMemo(() => pickForecastTarget({
    today,
    periods,
    nextStart: periodPrediction?.rangeStart ?? null,
    late: Boolean(periodPrediction?.late),
  }), [today, periods, periodPrediction?.rangeStart, periodPrediction?.late]);
  const stats = useMemo(() => (target && logs ? statsForTarget(target, periods, logs) : null), [target, periods, logs]);
  const safety = useMemo(() => {
    if (!target || !logs) return [];
    const currentStart = target.phase === "pre" ? periodPrediction?.rangeStart ?? target.cycleStart : target.cycleStart;
    return safetyLines(periods, logs, currentStart);
  }, [target, periods, logs, periodPrediction?.rangeStart]);

  useEffect(() => {
    if (!stats || !target || !profile?.id) return;
    const key = `${target.cycleStart}:${stats.dayLabel}`;
    if (requestedRef.current === key) return;
    requestedRef.current = key;
    setForecast(null);
    let cancelled = false;

    (async () => {
      const cached = await supabase.from("forecast_cache").select("text, tip")
        .eq("user_id", profile.id).eq("cycle_start", target.cycleStart).eq("day_label", stats.dayLabel).maybeSingle();
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
        user_id: profile.id, cycle_start: target.cycleStart, day_label: stats.dayLabel, text: result.text, tip: result.tip, source,
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
  }, [stats, target, profile?.id, session]);

  if (view !== "daughter" || !logs) return null;

  if (!stats) {
    const hasLogged = logs.some((log) => log.mood != null || log.pain != null || log.symptoms?.length);
    return hasLogged ? <p className="px-2 text-xs font-semibold text-slate-400">🌱 2 удаа тэмдэглэвэл чиний хэв маяг гарч ирнэ</p> : null;
  }

  const title = target.phase === "pre" ? "🍂 Сарын тэмдэг ойртож байна" : `❄️ Сарын тэмдгийн ${target.day} дэх өдөр`;
  return (
    <section className="rounded-3xl border border-pink-200 bg-white p-4 shadow-sm bloom-fade">
      <h2 className="font-black text-slate-700">{title}</h2>

      {forecast ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm font-bold leading-relaxed text-slate-700">{forecast.text}</p>
          <span className="inline-block rounded-full bb-bg-FDE7F1 px-3 py-1 text-xs font-extrabold bb-text-B83B7E">{forecast.tip}</span>
          {safety.map((line) => <p key={line} className="rounded-2xl bb-bg-FDE7F1-50 p-3 text-sm font-bold leading-relaxed bb-text-B83B7E">{line}</p>)}
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Өмнөх бүртгэлээ харж байна…</p>
      )}

      <p className="mt-3 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-400">🔒 Зөвхөн чамд харагдана · Өмнөх {stats.cyclesUsed} мөчлөгөөс</p>
    </section>
  );
}
