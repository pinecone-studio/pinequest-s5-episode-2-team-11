"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Pencil, Plus, Sparkles, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { askAi } from "../../../lib/ai-client";
import { supabase } from "../../../lib/supabase";
import { dateLabelMongolian, getCyclePatternInsight, localDateKey, periodDayKeys, predictPeriodRange } from "../../../lib/cycle";
import Card from "../ui/Card";
import BottomSheet from "../ui/BottomSheet";
import DayLogSheet from "./DayLogSheet";

const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const FLOW_MN = { light: "Бага", medium: "Дунд", heavy: "Их" };
const EMOTION_VALUE = { 5: "Happy", 4: "Calm", 3: "Calm", 2: "Anxious", 1: "Sad" };
const SYMPTOM_VALUE = {
  cramps: "Cramps", tired: "Fatigue", acne: "Spots", bloating: "Bloating",
  breast_tenderness: "Tenderness", headache: "Headache",
};

function readLegacyLogs() {
  const prefix = "bloom:tracker-log:";
  const logs = new Map();
  Object.keys(localStorage).filter((key) => key.startsWith(prefix)).forEach((key) => {
    const date = key.slice(prefix.length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > localDateKey(new Date())) return;
    try {
      const raw = JSON.parse(localStorage.getItem(key));
      logs.set(date, raw?.AM || raw?.PM ? { ...raw.AM, ...raw.PM } : raw ?? {});
    } catch { /* хуучин бүртгэлийг алгасна */ }
  });
  const prefixes = ["bloom:private-note:", "bloom:checkin:"];
  prefixes.forEach((itemPrefix) => Object.keys(localStorage).filter((key) => key.startsWith(itemPrefix)).forEach((key) => {
    const date = key.slice(itemPrefix.length);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && date <= localDateKey(new Date()) && !logs.has(date)) logs.set(date, {});
  }));
  return [...logs.entries()];
}

export default function PeriodCycleTracker({ onBack, cycleLength: _cycleLength, periodLength, lastPeriodStart: _lastPeriodStart }) {
  const { profile, session, linked, nameGen, sendToMom, setToast, periodStarts, periodLogs, noPeriodYet, savePeriodStartDates } = useFamily();
  const today = localDateKey(new Date());
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [logs, setLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingStarts, setEditingStarts] = useState(false);
  const [draftStarts, setDraftStarts] = useState([]);
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [savingStarts, setSavingStarts] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [insightLogs, setInsightLogs] = useState([]);
  const [previewSeed, setPreviewSeed] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !profile?.id) return () => { cancelled = true; };
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 365);
    supabase.rpc("get_my_day_logs", { p_from: localDateKey(fromDate), p_to: today }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[cycle-pattern]", error.message);
      setInsightLogs((data ?? []).map((row) => ({ log_date: row.log_date, mood: row.mood, pain: row.pain })));
    });
    return () => { cancelled = true; };
  }, [profile?.id, today]);

  const monthOffset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = useMemo(() => Array.from(
    { length: Math.ceil((monthOffset + daysInMonth) / 7) * 7 },
    (_, index) => new Date(month.getFullYear(), month.getMonth(), index - monthOffset + 1),
  ), [month, monthOffset, daysInMonth]);
  const visibleStarts = editingStarts ? draftStarts : periodStarts;
  const usableStarts = noPeriodYet ? [] : visibleStarts;
  const prediction = predictPeriodRange({ starts: usableStarts, today, hasHadPeriod: usableStarts.length > 0 });
  const periodDays = periodDayKeys(usableStarts, periodLength, today);
  const insight = useMemo(() => getCyclePatternInsight(previewSeed?.periods ?? periodStarts, previewSeed?.logs ?? insightLogs, today), [previewSeed, periodStarts, insightLogs, today]);
  const pendingPeriods = useMemo(() => Object.fromEntries((periodLogs ?? []).filter((row) => row.status === "pending").map((row) => [row.log_date, row])), [periodLogs]);
  const rangeDates = useMemo(() => {
    const keys = new Set();
    if (!prediction.rangeStart || !prediction.rangeEnd) return keys;
    for (let date = new Date(`${prediction.rangeStart}T00:00:00`); localDateKey(date) <= prediction.rangeEnd; date.setDate(date.getDate() + 1)) keys.add(localDateKey(date));
    return keys;
  }, [prediction.rangeStart, prediction.rangeEnd]);
  const firstCalendarDate = localDateKey(calendarDays[0]);
  const lastCalendarDate = localDateKey(calendarDays.at(-1));

  useEffect(() => {
    let cancelled = false;
    if (!supabase || !profile?.id) return () => { cancelled = true; };
    setLoadingLogs(true);
    supabase.rpc("get_my_day_logs", { p_from: firstCalendarDate, p_to: lastCalendarDate }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[day_logs] daughter's calendar:", error.message);
      setLogs(Object.fromEntries((data ?? []).map((row) => [row.log_date, row])));
      setLoadingLogs(false);
    });
    return () => { cancelled = true; };
  }, [profile?.id, firstCalendarDate, lastCalendarDate]);

  // Хуучин төхөөрөмжийн тэмдэглэлүүдийг шинэ хувийн RPC-р нэг удаа нүүлгэнэ.
  useEffect(() => {
    if (!profile?.id || !supabase || localStorage.getItem("bloom:day-log-migrated:v1")) return;
    let cancelled = false;
    const migrate = async () => {
      const legacy = readLegacyLogs();
      let failed = false;
      for (const [date, row] of legacy) {
        if (cancelled) return;
        let oldNote = "";
        let checkin = null;
        try {
          oldNote = localStorage.getItem(`bloom:private-note:${date}`) ?? "";
          checkin = JSON.parse(localStorage.getItem(`bloom:checkin:${date}`) ?? "null");
        } catch { /* хуучин тэмдэглэлийг алгасна */ }
        const symptoms = row.symptoms && SYMPTOM_VALUE[row.symptoms]
          ? [Object.entries(SYMPTOM_VALUE).find(([, value]) => value === row.symptoms)?.[0]].filter(Boolean)
          : checkin?.pain > 1 ? ["cramps"] : [];
        const flow = ({ Light: "light", Medium: "medium", Heavy: "heavy", Spotting: "light" })[row.period] ?? null;
        const { error } = await supabase.rpc("save_my_day_log", {
          p_log_date: date,
          p_mood: EMOTION_VALUE[row.emotion] ? Number(Object.keys(EMOTION_VALUE).find((value) => EMOTION_VALUE[value] === row.emotion)) : checkin?.mood ?? null,
          p_symptoms: symptoms,
          p_flow: flow,
          p_note: oldNote.slice(0, 500) || null,
          p_share_mood: false,
        });
        if (error) failed = true;
      }
      if (!cancelled && !failed) localStorage.setItem("bloom:day-log-migrated:v1", "true");
    };
    migrate();
    return () => { cancelled = true; };
  }, [profile?.id]);

  const openDay = (date) => setSelectedDate(localDateKey(date));
  const periodDayNumberFor = (key) => {
    if (!periodDays.has(key)) return 1;
    const start = usableStarts.filter((value) => value <= key).at(-1);
    return start ? Math.floor((new Date(`${key}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1 : 1;
  };
  const togglePeriodStart = (date) => {
    const key = localDateKey(date);
    if (key > today) return;
    setDraftStarts((current) => [...new Set(current.includes(key) ? current.filter((value) => value !== key) : [...current, key])].sort());
  };

  const savePeriodDates = async (dates) => {
    setSavingStarts(true);
    const ok = await savePeriodStartDates(dates, periodLength);
    setSavingStarts(false);
    if (ok) {
      setEditingStarts(false);
      setStartPickerOpen(false);
      setToast("Хадгаллаа");
    }
    return ok;
  };

  const addPeriodStart = async () => {
    const starts = [...new Set([...periodStarts, startDate])].sort();
    const ok = await savePeriodDates(starts);
    if (ok && startDate === today && linked) await sendToMom(`${nameGen} сарын тэмдэг өнөөдөр ирлээ. Бага зэрэг илүү халамж хэрэгтэй 💗`, "period");
  };

  const saveDailyLog = (row) => setLogs((current) => ({ ...current, [row.log_date]: row }));

  const makePreviewSeed = () => {
    const starts = [-112, -84, -56, -28].map((offset) => {
      const date = new Date(); date.setDate(date.getDate() + offset); return localDateKey(date);
    });
    const rows = [];
    starts.slice(0, -1).forEach((start, cycleIndex) => {
      [2, 8, 16, 24].forEach((cycleDay) => {
        const date = new Date(`${start}T00:00:00`); date.setDate(date.getDate() + cycleDay - 1);
        rows.push({ log_date: localDateKey(date), mood: cycleDay === 24 ? 2 + (cycleIndex % 2) : cycleDay < 6 ? 3 : 4 + (cycleIndex % 2), pain: cycleDay <= 5 ? (cycleDay === 1 ? 2 : 1) : null });
      });
    });
    setPreviewSeed({ periods: starts, logs: rows });
  };

  const generateSummary = async () => {
    if (!supabase || !profile?.id) return;
    setSummaryLoading(true);
    setSummaryError("");
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 180);
    const from = localDateKey(fromDate);
    const { data, error } = await supabase.rpc("get_my_day_logs", { p_from: from, p_to: today });
    if (error) {
      setSummaryError("Тэмдэглэл ачаалж чадсангүй. Supabase шинэчлэлээ шалгана уу.");
      setSummaryLoading(false);
      return;
    }
    const aiLogs = (data ?? []).map((row) => {
      const values = {};
      if (row.mood) values.emotion = EMOTION_VALUE[row.mood] ?? "Calm";
      const symptom = row.symptoms?.[0];
      if (symptom) values.symptoms = SYMPTOM_VALUE[symptom];
      if (row.flow) values.period = ({ light: "Light", medium: "Medium", heavy: "Heavy" })[row.flow];
      return { date: row.log_date, AM: values, PM: {} };
    }).filter((row) => Object.keys(row.AM).length);
    const response = await askAi(session, {
      type: "cycle_summary", cycleLength: _cycleLength || 28, periodLength,
      lastPeriodStart: periodStarts.at(-1) ?? _lastPeriodStart,
      logs: aiLogs,
    }, 30000, { detailed: true });
    if (response?.summary) setSummary(response);
    else setSummaryError("Дүгнэлт гаргаж чадсангүй. Дараа дахин оролдоорой.");
    setSummaryLoading(false);
  };

  const changeMonthBy = (amount) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const handleTouchStart = (event) => { touchStartX.current = event.touches[0]?.clientX ?? null; };
  const handleTouchEnd = (event) => {
    const endX = event.changedTouches[0]?.clientX;
    if (touchStartX.current == null || endX == null) return;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 60) changeMonthBy(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const monthName = `${month.getFullYear()} оны ${month.getMonth() + 1} сар`;
  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bb-bg-FFF7FB px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(14px,env(safe-area-inset-top))] text-slate-700">
      <div className="mx-auto max-w-md space-y-3">
        <header className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Буцах" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-lg font-black">Миний мөчлөг</h1>
        </header>

        {prediction.overNinetyDays && <Card className="!p-3"><p className="text-sm font-bold leading-relaxed text-amber-800">3 сараас удаан ирээгүй байна. Асран хамгаалагчтайгаа ярьж, эмчид үзүүлэхийг зөвлөж байна.</p></Card>}
        {prediction.late && <Card className="!p-3"><p className="text-center text-sm font-extrabold bb-text-B83B7E">Хоцорч байна. Эхний жилүүдэд ингэх нь хэвийн 💗</p></Card>}

        <Card className="!p-3">
          <div className="mb-1 flex items-center justify-between">
            <button type="button" onClick={() => changeMonthBy(-1)} aria-label="Өмнөх сар" className="rounded-xl p-2 text-slate-500"><ChevronLeft className="h-5 w-5" /></button>
            <p className="text-sm font-extrabold text-slate-700">{monthName}</p>
            <button type="button" onClick={() => changeMonthBy(1)} aria-label="Дараагийн сар" className="rounded-xl p-2 text-slate-500"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="select-none">
            <div className="grid grid-cols-7 text-center text-xs font-extrabold text-slate-400">{WEEKDAYS.map((weekday) => <span key={weekday} className="py-1.5">{weekday}</span>)}</div>
            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((date) => {
                const key = localDateKey(date);
                const inMonth = date.getMonth() === month.getMonth();
                const actualPeriod = periodDays.has(key);
                const pendingPeriod = pendingPeriods[key];
                const predicted = rangeDates.has(key) && key > today;
                const lateDay = prediction.late && rangeDates.has(key) && key <= today && !actualPeriod;
                const log = logs[key];
                const selected = selectedDate === key;
                let style = "text-slate-700 hover:bb-bg-FDE7F1";
                if (actualPeriod) style = "bb-bg-E0679F font-extrabold text-white";
                else if (pendingPeriod) style = "border-2 border-dashed border-amber-400 text-amber-600";
                else if (lateDay) style = "border-2 border-dashed border-slate-400 text-slate-500";
                else if (predicted) style = "border-2 border-dashed bb-border-F48FB1 bb-text-B83B7E";
                if (editingStarts && visibleStarts.includes(key)) style = "bb-bg-E0679F font-extrabold text-white ring-2 ring-pink-300";
                return (
                  <button key={key} type="button" onClick={() => editingStarts ? togglePeriodStart(date) : openDay(date)} disabled={editingStarts && key > today}
                    aria-label={`${dateLabelMongolian(date)}${actualPeriod ? ", сарын тэмдэг" : predicted ? ", таамаг" : ""}${log ? ", тэмдэглэлтэй" : ""}`}
                    className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition active:scale-90 ${style} ${!inMonth ? "opacity-40" : ""} ${key === today ? "outline outline-2 outline-offset-1 outline-pink-400" : ""} ${selected ? "ring-2 ring-purple-400" : ""} ${editingStarts && key > today ? "cursor-not-allowed opacity-30" : ""}`}>
                    {date.getDate()}
                    {pendingPeriod && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-amber-500"><Clock3 className="h-3 w-3" /></span>}
                    {log && <span className={`absolute -bottom-0.5 h-1.5 w-1.5 rounded-full ${actualPeriod ? "bg-white" : "bb-bg-B794F4"}`} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500">
            <span><b className="bb-text-B83B7E">●</b> Болсон</span><span><b className="bb-text-B83B7E">◌</b> Таамаг</span><span><b className="bb-text-7C4DCC">•</b> Тэмдэглэлтэй</span>
            {Object.keys(pendingPeriods).length > 0 && <span><Clock3 className="mr-0.5 inline h-3 w-3 text-amber-500" /> Батлах</span>}
          </div>
          {loadingLogs && <p className="mt-2 text-center text-xs font-semibold text-slate-400">Өдрийн бүртгэл ачаалж байна…</p>}
          {!periodStarts.length && <p className="mt-2 text-center text-xs font-semibold text-slate-400">Сарын тэмдэг хараахан ирээгүй бол зөвхөн өдрийн тэмдэглэл хөтөлж болно.</p>}
        </Card>

        <Card className="!p-3">
          {editingStarts ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold leading-relaxed text-slate-500">Календарь дээр эхэлсэн өдрүүдийг дарж сонгоно. Таамагт тасархай дугуйг ашиглана.</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setEditingStarts(false)} disabled={savingStarts} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">Болих</button>
                <button type="button" onClick={() => savePeriodDates(draftStarts)} disabled={savingStarts || !draftStarts.length} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white disabled:opacity-50">{savingStarts ? "Хадгалж байна…" : "Хадгалах"}</button>
              </div>
            </div>
          ) : startPickerOpen ? (
            <div className="space-y-2">
              <label htmlFor="period-start-date" className="block text-sm font-extrabold text-slate-700">Эхэлсэн өдрөө сонгоорой</label>
              <input id="period-start-date" type="date" value={startDate} max={today} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700" />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setStartPickerOpen(false)} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">Болих</button>
                <button type="button" onClick={addPeriodStart} disabled={savingStarts || !startDate || startDate > today} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white disabled:opacity-50">{savingStarts ? "Хадгалж байна…" : "Хадгалах"}</button>
              </div>
              <p className="text-center text-xs font-semibold text-slate-400">Үргэлжлэх хугацаа: {periodLength} хоног</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setStartDate(today); setStartPickerOpen(true); }} className="flex items-center justify-center gap-1.5 rounded-2xl bb-bg-FDE7F1 py-3 text-xs font-extrabold bb-text-B83B7E"><Plus className="h-4 w-4" /> Сарын тэмдэг эхэлсэн</button>
              <button type="button" onClick={() => { setDraftStarts(periodStarts); setEditingStarts(true); }} className="flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-3 text-xs font-extrabold text-slate-600"><Pencil className="h-4 w-4" /> Өдрүүдийг засах</button>
            </div>
          )}
        </Card>

        <Card className="!p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div><h2 className="text-sm font-extrabold text-slate-700">Миний бүртгэлийн хэв маяг</h2><p className="mt-1 text-[10px] font-semibold text-slate-400">Өөрийн тэмдэглэлээс тооцсон · онош биш</p></div>
            {process.env.NODE_ENV === "development" && <button type="button" onClick={() => previewSeed ? setPreviewSeed(null) : makePreviewSeed()} className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{previewSeed ? "Жишээг хаах" : "Жишээ харах"}</button>}
          </div>
          {insight.enoughData ? <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500">Сүүлийн {insight.completedCycles} дууссан мөчлөг · {insight.loggedDays} сэтгэл санааны тэмдэглэл</p>
            <div className="space-y-2">{insight.moodByPhase.map((item) => <div key={item.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-600"><span>{item.label}</span><span>{item.average.toFixed(1)}/5 · {item.count} өдөр</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${item.label}: дундаж ${item.average.toFixed(1)} оноо`}><div className="h-full rounded-full bb-bg-B794F4" style={{ width: `${Math.max(4, item.average / 5 * 100)}%` }} /></div>
            </div>)}</div>
            {insight.painByPeriodDay.length > 0 && <p className="rounded-xl bb-bg-FDE7F1-50 px-3 py-2 text-[11px] font-semibold leading-5 text-slate-600">Өвдөлтийн тэмдэглэл: {insight.painByPeriodDay.map((item) => `${item.day}-р өдөр ${item.average.toFixed(1)}/3 (${item.count})`).join(" · ")}</p>}
            <p className="text-[10px] font-semibold text-slate-400">Энэ нь зөвхөн бүртгэлийн дундаж бөгөөд ирээдүйн мэдрэмжийг хэлэхгүй.</p>
          </div> : <p className="text-xs font-semibold leading-5 text-slate-500">Хэв маяг харуулахад дор хаяж 2 дууссан мөчлөг, 10 өдрийн сэтгэл санааны тэмдэглэл хэрэгтэй. Одоогоор {insight.completedCycles} мөчлөг, {insight.loggedDays} тэмдэглэл байна.</p>}
        </Card>

        <Card className="!p-3">
          <button type="button" onClick={generateSummary} disabled={summaryLoading} className="flex w-full items-center justify-center gap-2 rounded-2xl bb-bg-E9DDFC py-3 text-sm font-extrabold bb-text-7C4DCC disabled:opacity-60">
            {summaryLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {summaryLoading ? "Дүгнэж байна…" : "Мөчлөгийн тэмдэглэлээ дүгнүүлэх"}
          </button>
          <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">Хувийн бичвэр хуваалцахгүй</p>
          {summaryError && <p role="alert" className="mt-2 text-xs font-bold text-rose-600">{summaryError}</p>}
          {summary?.summary && <div className="mt-3 space-y-2 rounded-2xl bb-bg-FFF7FB p-3 text-sm font-semibold leading-relaxed text-slate-600"><p>{summary.summary}</p>{[summary.beforePeriod, summary.duringPeriod, summary.afterPeriod, summary.mood, summary.body].filter(Boolean).map((item) => <p key={item}>{item}</p>)}</div>}
        </Card>
      </div>

      {selectedDate && <DayLogSheet key={selectedDate} date={selectedDate} initialMood={logs[selectedDate]?.mood ?? null} isPeriodDay={periodDays.has(selectedDate)} periodDayNumber={periodDayNumberFor(selectedDate)} pendingPeriod={pendingPeriods[selectedDate] ?? null} onClose={() => setSelectedDate(null)} onSaved={saveDailyLog} />}
    </main>
  );
}
