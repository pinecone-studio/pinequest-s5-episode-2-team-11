"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Droplets, Heart, LoaderCircle, Moon, Pencil, Plus, Sparkles, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { askAi } from "../../../lib/ai-client";
import { supabase } from "../../../lib/supabase";
import { dateLabelMongolian, localDateKey, periodDayKeys, predictPeriodRange } from "../../../lib/cycle";
import Card from "../ui/Card";
import BottomSheet from "../ui/BottomSheet";
import DayLogSheet from "./DayLogSheet";
import CycleLegend from "./CycleLegend";

const sortPeriodStarts = (dates, today) => [...new Set((dates ?? []).filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today))].sort();
const cycleGapsFromStarts = (dates) => dates.slice(1).map((date, index) => {
  const from = new Date(`${dates[index]}T00:00:00`);
  const to = new Date(`${date}T00:00:00`);
  return Math.round((to - from) / 86400000);
}).filter((days) => days >= 15 && days <= 60);
const cycleLengthFromStarts = (dates, fallback) => {
  const gaps = cycleGapsFromStarts(dates);
  return gaps.length ? Math.round(gaps.reduce((sum, days) => sum + days, 0) / gaps.length) : fallback;
};

// Хадгалах утга нь англиар (хуучин бүртгэлтэй нийцүүлэх), дэлгэцэнд монголоор харуулна
const categories = [
  { id: "emotion", name: "Сэтгэл", icon: Heart, options: ["Happy", "Calm", "Sad", "Anxious", "Embarrassed", "Irritable"] },
  { id: "symptoms", name: "Шинж", icon: Activity, options: ["Cramps", "Headache", "Bloating", "Fatigue", "Tenderness"] },
  { id: "period", name: "Урсгал", icon: Droplets, options: ["None", "Spotting", "Light", "Medium", "Heavy"] },
  { id: "skin", name: "Арьс", icon: Sparkles, options: ["Clear", "Spots", "Oily", "Dry", "Sensitive"] },
  { id: "sleep", name: "Нойр", icon: Moon, options: ["Poor", "Okay", "Good", "Great"] },
];

const trackerValueMn = {
  Happy: "Баяртай",
  Calm: "Тайван",
  Sad: "Гунигтай",
  Anxious: "Түгшсэн",
  Embarrassed: "Ичсэн",
  Irritable: "Уурлангуй",
  Cramps: "Базлалт",
  Headache: "Толгой өвдсөн",
  Bloating: "Гэдэс дүүрсэн",
  Fatigue: "Ядарсан",
  Tenderness: "Хөхөөр хөндүүр",
  None: "Байхгүй",
  Spotting: "Толбо",
  Light: "Бага",
  Medium: "Дунд",
  Heavy: "Их",
  Clear: "Цэвэр",
  Spots: "Батга",
  Oily: "Тостой",
  Dry: "Хуурай",
  Sensitive: "Мэдрэг",
  Poor: "Муу",
  Okay: "Дунд",
  Good: "Сайн",
  Great: "Маш сайн",
};

const valueEmoji = {
  Happy: "😊",
  Calm: "😌",
  Sad: "😢",
  Anxious: "😟",
  Embarrassed: "😳",
  Irritable: "😠",
};

// Тэмдэглэлийн бичвэрээс сэтгэлийг зөвхөн утсан дээр таана (бичвэр хаашаа ч илгээгдэхгүй)
const NOTE_MOOD_WORDS = {
  Happy: ["баяр", "гоё", "сайхан", "хөгжилтэй", "инээ", "аз жарга", "хөөр", "дуртай", "😊", "😄", "🥰"],
  Calm: ["тайван", "амар", "амарсан", "амраа", "зүгээр", "😌"],
  Sad: ["гуни", "уйл", "гомд", "ганцаар", "гутар", "санаа унах", "😢", "😭"],
  Anxious: ["санаа зов", "түгш", "айсан", "айж", "сандар", "стресс", "шалгалт", "😟", "😰"],
  Embarrassed: ["ичи", "ичс", "эвгүй", "😳"],
  Irritable: ["уур", "бухимд", "залхсан", "уцаар", "😠", "😡"],
};
const guessNoteMood = (text) => {
  const lower = text.toLowerCase();
  let best = null;
  let bestHits = 0;
  Object.entries(NOTE_MOOD_WORDS).forEach(([mood, words]) => {
    const hits = words.filter((word) => lower.includes(word)).length;
    if (hits > bestHits) {
      best = mood;
      bestHits = hits;
    }
  });
  return best;
};

const mn = (value) => trackerValueMn[value] ?? value;
// Хуучин бүртгэл { AM, PM } хэлбэртэй байсан — өдрийн нэг бүртгэл болгож нийлүүлнэ
const flat = (log) => (log && (log.AM || log.PM) ? { ...(log.AM ?? {}), ...(log.PM ?? {}) } : log ?? {});
const PHASE = { period: "period", ovulation: "ovulation" };
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
  const { profile, session, linked, nameGen, sendToMom, setToast, periodStarts, noPeriodYet, savePeriodStartDates } = useFamily();
  const today = localDateKey(new Date());
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [logs, setLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingStarts, setEditingStarts] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState({}); // огноо → тэмдэглэлийн бичвэр (зөвхөн энэ утсан дээр)
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [cycleSummary, setCycleSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const touchStartX = useRef(null);

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
  const rangeDates = useMemo(() => {
    const keys = new Set();
    if (!prediction.rangeStart || !prediction.rangeEnd) return keys;
    for (let date = new Date(`${prediction.rangeStart}T00:00:00`); localDateKey(date) <= prediction.rangeEnd; date.setDate(date.getDate() + 1)) keys.add(localDateKey(date));
    return keys;
  }, [prediction.rangeStart, prediction.rangeEnd]);
  const firstCalendarDate = localDateKey(calendarDays[0]);
  const lastCalendarDate = localDateKey(calendarDays.at(-1));

  useEffect(() => {
    const prefix = "bloom:tracker-log:";
    const result = Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .reduce((all, key) => {
        try { all[key.slice(prefix.length)] = JSON.parse(window.localStorage.getItem(key)); } catch { /* skip bad entry */ }
        return all;
      }, {});
    setLogs(result);
    const since = localDateKey(new Date(Date.now() - 30 * 86400000));
    syncDays(Object.entries(result).filter(([d]) => d >= since).map(([d, v]) => [d, flat(v)]));
    setNotes(Object.fromEntries(
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("bloom:private-note:"))
        .map((k) => [k.slice(19), window.localStorage.getItem(k) ?? ""]),
    ));
    setNote(window.localStorage.getItem(`bloom:private-note:${selectedDate}`) ?? "");
  }, []);

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

  const saveNote = () => {
    const key = `bloom:private-note:${selectedDate}`;
    const nextNotes = { ...notes };
    if (note.trim()) {
      window.localStorage.setItem(key, note.trim());
      nextNotes[selectedDate] = note.trim();
    } else {
      window.localStorage.removeItem(key);
      delete nextNotes[selectedDate];
    }
    setNotes(nextNotes);
    setToast("Тэмдэглэл хадгалагдлаа");
    setSheetOpen(false);
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

  const monthLogDates = useMemo(
    () => new Set([...Object.keys(logs).filter((k) => Object.keys(flat(logs[k])).length), ...Object.keys(notes)]),
    [logs, notes],
  );

  // Тэмдэглэлтэй өдрийн эможи: тэр өдөр сонгосон «Сэтгэл» → эс бөгөөс бичвэрээс таасан → 📝
  const noteEmoji = useMemo(() => {
    const result = {};
    Object.entries(notes).forEach(([date, text]) => {
      const mood = flat(logs[date]).emotion ?? guessNoteMood(text);
      result[date] = valueEmoji[mood] ?? "📝";
    });
    return result;
  }, [notes, logs]);

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
          <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-[#968b9e]">
            {WEEKDAYS.map((d) => <span key={d} className="py-1.5">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-x-1 gap-y-1.5">
            {calendarDays.map((date) => {
              const key = localDateKey(date);
              const inMonth = date.getMonth() === month.getMonth();
              const isToday = key === today;
              const kind = dayKind(date, key);
              const logged = monthLogDates.has(key);
              const recordedStart = visiblePeriodStarts.includes(key);
              const style =
                recordedStart
                  ? "bg-[#e96691] font-extrabold text-white ring-2 ring-[#ffd1e0]"
                  : kind === "period"
                  ? "bg-[#e96691] font-extrabold text-white"
                  : kind === "predicted"
                    ? "border-2 border-dashed border-[#f4a1ba] text-[#f4a1ba]"
                    : kind === "ovulation"
                      ? "bg-[#3a3158] text-[#cdb5ff]"
                      : inMonth
                        ? "text-[#e8dfed] hover:bg-[#2a2332]"
                        : "text-[#62596b]";
              return (
                <button key={key} type="button" onClick={() => selectDate(date)} disabled={editingStarts && key > today}
                  aria-label={`${dateLabel(date)}${recordedStart ? ", сарын тэмдэг эхэлсэн өдөр" : kind === "period" ? ", сарын тэмдэг" : kind === "predicted" ? ", таамаг" : kind === "ovulation" ? ", овуляци" : ""}${logged ? ", тэмдэглэлтэй" : ""}`}
                  style={logged ? { boxShadow: "0 0 0 1.5px rgb(244 161 186 / 65%)" } : undefined}
                  className={`cycle-day relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition active:scale-90 ${style} ${!inMonth ? "opacity-40" : ""} ${editingStarts && key > today ? "cursor-not-allowed opacity-30" : ""} ${isToday ? "cycle-today outline outline-2 outline-offset-2 outline-white/70" : ""}`}>
                  <span>{date.getDate()}</span>
                  {noteEmoji[key] && (
                    <span aria-hidden className="pointer-events-none absolute -right-1.5 -top-1.5 text-[13px] leading-none drop-shadow">
                      {noteEmoji[key]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#a99eaf]">
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#e96691]" /> Сарын тэмдэг</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-[#f4a1ba]" /> Таамаг</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#3a3158] ring-1 ring-[#cdb5ff]" /> Овуляци</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border border-[#f4a1ba]/70" /> Тэмдэглэсэн</span>
            <span className="flex items-center gap-1"><span className="text-[11px] leading-none">😊</span> Тэмдэглэлийн сэтгэл</span>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#7d7286]">{editingStarts ? "Ягаанаар тэмдэглэсэн өдрийг дахин дарж хасна" : "Өдөр дээр дарж тэмдэглэнэ"}</p>
        </Card>

        {/* ---------- Дараагийн мөчлөг ---------- */}
        <section className="flex items-center gap-3 rounded-[24px] border border-[#49313f] bg-gradient-to-br from-[#2b202d] to-[#211b29] p-3">
          <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#3a2534] text-[#ffb6cf]">
            <span className="text-base font-black leading-none">{daysToNext != null && daysToNext >= 0 ? daysToNext : "–"}</span>
            <span className="text-[9px] font-bold">хоног</span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[#f3c2d3]">
              {nextPeriodLabel ? `Тооцоолсон дараагийн өдөр: ${nextPeriodLabel}` : visiblePeriodStarts.length ? "Дундаж тооцоход дараагийн эхэлсэн өдрөө тэмдэглээрэй" : "Сарын тэмдэг эхэлсэн өдрөө тэмдэглээрэй"}
            </p>
            {(commonEmotion || commonSymptoms.length > 0) && (
              <p className="mt-0.5 text-xs text-[#c9bccf]">
                Өмнө нь: {[commonEmotion && mn(commonEmotion), ...commonSymptoms.map(mn)].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </section>

        {/* ---------- AI дүгнэлт ---------- */}
        <section className="rounded-[24px] border border-[#302838] bg-[#1a1721] p-3">
          <button type="button" onClick={generateCycleSummary} disabled={summaryLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#80658a] py-3 text-sm font-extrabold text-white disabled:opacity-60">
            {summaryLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Дүгнэж байна…</> : <><Sparkles className="h-4 w-4" /> AI-аар мөчлөгөө дүгнүүлэх</>}
          </button>
          <p className="mt-2 text-center text-[11px] text-[#8f8497]">Хувийн тэмдэглэл AI руу илгээгдэхгүй</p>
          {summaryError && <p role="alert" className="mt-2 text-sm font-semibold text-[#f3a2b2]">{summaryError}</p>}
          {cycleSummary && (
            <div className="mt-3 space-y-2 rounded-2xl bg-[#211c29] p-3 text-sm leading-relaxed">
              <p className="font-bold text-[#f2d5e3]">{cycleSummary.summary}</p>
              {[["Өмнө", cycleSummary.beforePeriod], ["Үеэр", cycleSummary.duringPeriod], ["Дараа", cycleSummary.afterPeriod], ["Сэтгэл", cycleSummary.mood], ["Бие", cycleSummary.body]].map(([title, value]) => value && (
                <p key={title}><span className="font-extrabold text-[#cdb5dc]">{title}: </span><span className="text-[#ddd2e2]">{value}</span></p>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedDate && <DayLogSheet key={selectedDate} date={selectedDate} initialMood={logs[selectedDate]?.mood ?? null} isPeriodDay={periodDays.has(selectedDate)} onClose={() => setSelectedDate(null)} onSaved={saveDailyLog} />}
    </main>
  );
}
