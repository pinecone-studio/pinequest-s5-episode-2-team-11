"use client";

/**
 * Асран хамгаалагчийн «Календарь» — охины календарьтай ижил загвар.
 *   • Өдрийн өнгө: сарын тэмдэг · таамаг · бүртгэсэн өдөр (цэг)
 *   • Охины ХУВИЙН ТЭМДЭГЛЭЛ харагдахгүй. Зөвхөн «Энэ 7 хоног»-ийн тойм харуулна.
 *   • Сэтгэл санааг зөвхөн тусгай RPC-ээр, охин хуваалцахыг зөвшөөрсөн үед харуулна.
 */

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, Sparkles, LoaderCircle, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { supabase } from "../../../lib/supabase";
import { askAi } from "../../../lib/ai-client";
import { toDateStr } from "../../../lib/dates";
import { periodDayKeys, predictPeriodRange } from "../../../lib/cycle";
import CycleRing from "../daughter/CycleRing";
import CycleLegend from "../daughter/CycleLegend";
import { genitive } from "../../../lib/helpers";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SectionTitle from "../ui/SectionTitle";

const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const parse = (key) => new Date(`${key}T00:00:00`);
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
const dateLabel = (d) => `${d.getMonth() + 1} сарын ${d.getDate()}`;
const MOOD_LABEL = { 5: "маш сайхан", 4: "сайхан", 3: "дундаж", 2: "тавгүй", 1: "хэцүү" };
const MOOD_EMOJI = { 5: "😄", 4: "🙂", 3: "😐", 2: "😟", 1: "😣" };

export default function MotherCalendar() {
  const { linked, activeChildId, daughterName, hasCycle, cycleLength, periodLength, lastPeriodStart, noPeriodYet, phaseKey, daysUntil, daysLate, day, shareWithMom, session } =
    useFamily();
  const today = toDateStr();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [markingPeriod, setMarkingPeriod] = useState(false);

  // Сүүлийн 60 хоногийн ангилсан бүртгэл (RLS: охин хуваалцсан үед л ирнэ)
  useEffect(() => {
    setRows([]);
    setAi(null);
    setAiError("");
    if (!supabase || !linked || !activeChildId) return;
    let cancelled = false;
    const since = toDateStr(new Date(Date.now() - 60 * 86400000));
    supabase
      .rpc("get_shared_daily_moods", { p_child_id: activeChildId, p_from: since, p_to: today })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn("[day_logs] mother:", error.message);
        setRows(data ?? []);
      });
    return () => { cancelled = true; };
  }, [linked, activeChildId, shareWithMom]);

  const byDate = useMemo(() => Object.fromEntries(rows.map((r) => [r.log_date, r])), [rows]);
  const weekStart = toDateStr(new Date(Date.now() - 6 * 86400000));
  const week = rows.filter((r) => r.log_date >= weekStart && r.log_date <= today);

  // Өмнө гаргасан AI тоймыг энэ 7 хоногт дахин дуудахгүйн тулд хадгална
  const cacheKey = `bloom:weekly-summary:${activeChildId ?? "x"}:${weekStart}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(cacheKey) ?? "null");
      if (saved?.summary) setAi(saved);
    } catch {}
  }, [cacheKey]);

  const dates = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    const count = Math.ceil((offset + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  }, [month]);
  const monthLabel = `${month.getFullYear()} оны ${month.getMonth() + 1}-р сар`;

  const childStarts = lastPeriodStart ? [lastPeriodStart] : [];
  const periodDays = periodDayKeys(childStarts, periodLength, today);
  const prediction = predictPeriodRange({ starts: childStarts, today, hasHadPeriod: Boolean(lastPeriodStart) && !noPeriodYet });
  const rangeDates = useMemo(() => {
    const keys = new Set();
    if (!prediction.rangeStart || !prediction.rangeEnd) return keys;
    for (let date = parse(prediction.rangeStart); toDateStr(date) <= prediction.rangeEnd; date.setDate(date.getDate() + 1)) keys.add(toDateStr(date));
    return keys;
  }, [prediction.rangeStart, prediction.rangeEnd]);
  const dayInfo = (key) => periodDays.has(key) ? "period" : rangeDates.has(key) && key > today ? "predicted" : prediction.late && rangeDates.has(key) && key <= today ? "late" : null;
  const moodCounts = {};
  week.forEach((row) => row.mood && (moodCounts[row.mood] = (moodCounts[row.mood] ?? 0) + 1));
  const commonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  const askSummary = async () => {
    setAiLoading(true);
    setAiError("");
    const result = await askAi(
      session,
      {
        type: "weekly_summary",
        daughterName,
        phase: phaseKey,
        daysUntil,
        days: week.map((r) => ({ date: r.log_date, mood: r.mood })),
      },
      25000,
      { detailed: true },
    );
    setAiLoading(false);
    if (result?.summary) {
      setAi(result);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {}
    } else setAiError("AI тойм гаргаж чадсангүй. Дараа дахин оролдоорой.");
  };

  if (!linked)
    return (
      <div className="space-y-4">
        <PageHeader sub="Охины мөчлөг" title="Календарь" />
        <Card><p className="py-4 text-center text-sm font-semibold text-slate-500">Охиноо холбосны дараа календарь харагдана 🌱</p></Card>
      </div>
    );

  const sel = selected ? { key: selected, date: parse(selected), kind: dayInfo(selected) } : null;

  return (
    <div className="space-y-4">
      <PageHeader sub={`${daughterName || "Охин"} · мөчлөг`} title="Календарь" />

      {/* ---------- Мөчлөгийн цагираг (дарахад хуанли нээгдэнэ) ---------- */}
      <Card>
        <SectionTitle
          icon={Droplets}
          title="Охины мөчлөг"
          right={
            <button type="button" onClick={() => setCalendarOpen(true)} className="flex items-center gap-1 rounded-full bb-bg-FDE7F1 bb-text-B83B7E px-2.5 py-1.5 text-xs font-extrabold active:scale-95">
              <CalendarDays className="h-3.5 w-3.5" /> Хуанли
            </button>
          }
        />
        {hasCycle && !noPeriodYet ? (
          <>
            <button type="button" onClick={() => setCalendarOpen(true)} aria-label="Охины хуанли нээх" className="mx-auto block w-fit rounded-full active:scale-95 transition-transform">
              <CycleRing day={day} cycleLength={cycleLength} periodLength={periodLength} phaseKey={phaseKey} daysUntil={prediction.rangeStart && prediction.rangeStart > today ? Math.max(0, dayDiff(today, prediction.rangeStart)) : daysUntil} daysLate={prediction.late ? Math.max(daysLate, 1) : 0} />
            </button>
            <div className="mt-3"><CycleLegend compact /></div>
            <p className="mt-2 text-center text-xs font-semibold text-slate-400">Цагираг дээр дарж хуанли нээнэ</p>
          </>
        ) : (
          <p className="text-sm font-semibold text-slate-500">Охины мөчлөгийн мэдээлэл хараахан ороогүй байна 🌱</p>
        )}
      </Card>

      {/* ---------- Энэ 7 хоног ---------- */}
      <Card>
        <SectionTitle icon={CalendarDays} title="Энэ 7 хоног" />
        {!shareWithMom ? (
          <p className="flex items-start gap-2 text-sm font-semibold text-slate-500">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" /> {daughterName || "Охин"} бүртгэлээ хувьдаа хадгалсан байна. Энэ бол хэвийн 🌸
          </p>
        ) : week.length === 0 ? (
          <p className="text-sm font-semibold text-slate-500">Энэ 7 хоногт бүртгэл алга.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bb-bg-FDE7F1 bb-text-B83B7E px-3 py-1.5 text-xs font-extrabold">{week.length} өдөр бүртгэсэн</span>
              {commonMood && <span className="rounded-full bb-bg-E9DDFC bb-text-7C4DCC px-3 py-1.5 text-xs font-extrabold">{MOOD_EMOJI[commonMood[0]]} Ихэвчлэн {MOOD_LABEL[commonMood[0]]}</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600">Зөвхөн сэтгэл санааг харуулж байна</span>
            </div>

            {ai?.summary ? (
              <div className="mt-4 rounded-2xl bb-bg-FFF7FB p-3 space-y-2 bloom-pop">
                <p className="text-sm font-bold text-slate-700 leading-relaxed">{ai.summary}</p>
                {ai.tips?.map((t) => (
                  <p key={t} className="text-sm font-semibold text-slate-600">💡 {t}</p>
                ))}
                {flowDays > 0 && <span className="rounded-full bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-extrabold">🩸 {flowDays} өдөр</span>}
                {sleep && <span className="rounded-full bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-extrabold">Нойр {MN[sleep[0]]}</span>}
              </div>

              {ai?.summary ? (
                <div className="mt-4 rounded-2xl bb-bg-FFF7FB p-3 space-y-2 bloom-pop">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{ai.summary}</p>
                  {ai.tips?.map((t) => (
                    <p key={t} className="text-sm font-semibold text-slate-600">💡 {t}</p>
                  ))}
                </div>
              ) : (
                <button
                  onClick={askSummary}
                  disabled={aiLoading}
                  className="mt-4 w-full rounded-2xl bb-grad-sos text-white py-3 text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-60"
                >
                  {aiLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiLoading ? "Тойм гаргаж байна…" : "AI-аар 7 хоногийн тойм, зөвлөмж авах"}
                </button>
              )}
              {aiError && <p className="mt-2 text-xs font-semibold bb-text-7C4DCC">{aiError}</p>}
            </>
          )}
        </Card>
      )}

      {/* ---------- Хуанли (бүтэн дэлгэц) ---------- */}
      {calendarOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center" style={{ background: "rgba(43,34,48,0.4)" }} onClick={() => setCalendarOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Охины хуанли"
            onClick={(e) => e.stopPropagation()}
            className="bloom-fade w-full max-w-md h-full overflow-y-auto bb-bg-FFF7FB px-4 space-y-4"
            style={{ paddingTop: "max(14px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center gap-3">
              <button onClick={() => setCalendarOpen(false)} aria-label="Буцах" className="w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-500">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-black text-slate-800">{daughterName ? `${daughterName}-ийн хуанли` : "Охины хуанли"}</h2>
            </div>
      <Card className="!p-3">
        <div className="mb-1 flex items-center justify-between">
          <button type="button" aria-label="Өмнөх сар" onClick={() => setMonth((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))} className="rounded-xl p-2 text-slate-500">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-extrabold text-slate-700">{monthLabel}</p>
          <button type="button" aria-label="Дараагийн сар" onClick={() => setMonth((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))} className="rounded-xl p-2 text-slate-500">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-extrabold text-slate-400">
          {WEEKDAYS.map((w) => <span key={w} className="py-1.5">{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {dates.map((date) => {
            const key = toDateStr(date);
            const kind = dayInfo(key);
            const inMonth = date.getMonth() === month.getMonth();
            const logged = Boolean(byDate[key]);
            const style =
              kind === "period"
                ? "bb-bg-E0679F text-white font-extrabold"
                : kind === "predicted"
                  ? "border-2 border-dashed bb-border-F48FB1 bb-text-B83B7E"
                  : kind === "late"
                    ? "border-2 border-dashed border-slate-400 text-slate-500"
                    : "text-slate-700";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-label={dateLabel(date)}
                className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold active:scale-90 transition ${style} ${inMonth ? "" : "opacity-40"}`}
                style={key === today ? { boxShadow: "0 0 0 2px #F48FB1" } : undefined}
              >
                {date.getDate()}
                {logged && <span className={`absolute -bottom-1.5 h-1.5 w-1.5 rounded-full ${kind === "period" ? "bb-bg-FDE7F1" : "bb-bg-B794F4"}`} />}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bb-bg-E0679F" /> Сарын тэмдэг</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border-2 border-dashed bb-border-F48FB1" /> Таамаг</span>
          <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-slate-400" /> Хоцорсон хугацаа</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bb-bg-B794F4" /> Бүртгэсэн</span>
        </div>
        {(noPeriodYet || !hasCycle) && (
          <p className="mt-2 text-center text-xs font-semibold text-slate-400">Охины мөчлөгийн мэдээлэл хараахан ороогүй байна 🌱</p>
        )}
      </Card>
          </div>
        </div>
      )}

      {/* ---------- Өдөр дээр дарахад ---------- */}
      {sel && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center" style={{ background: "rgba(43,34,48,0.4)" }} onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={dateLabel(sel.date)} className="bloom-pop w-full max-w-md rounded-t-[28px] bb-bg-FFF7FB px-4 pt-2" style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}>
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-black text-slate-800">{dateLabel(sel.date)}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Хаах" className="w-9 h-9 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {sel.kind === "predicted"
                ? "Сарын тэмдэг энэ хугацаанд ирж магадгүй. Хугацаа хүн бүрт өөр байдаг."
                : sel.kind === "late"
                  ? "Энэ нь зөвхөн ойролцоо таамаг. Эхний жилүүдэд мөчлөг зөрөх нь хэвийн."
                  : sel.kind === "period"
                    ? "Сарын тэмдгийн өдрөөр тэмдэглэгдсэн байна."
                    : byDate[sel.key]?.mood
                      ? `Охин энэ өдрийн сэтгэл санааг хуваалцсан: ${MOOD_EMOJI[byDate[sel.key].mood]}`
                      : "Энэ өдөрт хуваалцсан бүртгэл алга."}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Lock className="h-3.5 w-3.5" /> Хувийн тэмдэглэл, биеийн шинж танд харагдахгүй.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
