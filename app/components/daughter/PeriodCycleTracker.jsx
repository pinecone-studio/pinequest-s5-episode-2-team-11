"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Heart,
  LoaderCircle,
  Moon,
  Pencil,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
import { askAi } from "../../../lib/ai-client";
import CycleSetup from "../onboarding/CycleSetup";

const localDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

const mn = (value) => trackerValueMn[value] ?? value;
// Хуучин бүртгэл { AM, PM } хэлбэртэй байсан — өдрийн нэг бүртгэл болгож нийлүүлнэ
const flat = (log) => (log && (log.AM || log.PM) ? { ...(log.AM ?? {}), ...(log.PM ?? {}) } : log ?? {});
const PHASE = { period: "period", ovulation: "ovulation" };
const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const WEEKDAY_LONG = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];
const dateLabel = (d) => `${d.getMonth() + 1}-р сарын ${d.getDate()}, ${WEEKDAY_LONG[d.getDay()]}`;

export default function PeriodCycleTracker({ onBack, cycleLength, periodLength, lastPeriodStart }) {
  const { saveCycle, startPeriod, setToast, session } = useFamily();
  const { theme, setTheme } = useTheme();
  const [today] = useState(() => localDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [logs, setLogs] = useState({});
  const [note, setNote] = useState("");
  const [noteDates, setNoteDates] = useState(() => new Set());
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [cycleSummary, setCycleSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState(false);

  useEffect(() => {
    const prefix = "bloom:tracker-log:";
    const result = Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .reduce((all, key) => {
        try { all[key.slice(prefix.length)] = JSON.parse(window.localStorage.getItem(key)); } catch { /* skip bad entry */ }
        return all;
      }, {});
    setLogs(result);
    setNoteDates(new Set(Object.keys(window.localStorage).filter((k) => k.startsWith("bloom:private-note:")).map((k) => k.slice(19))));
    setNote(window.localStorage.getItem(`bloom:private-note:${selectedDate}`) ?? "");
  }, []);

  const monthOffset = (month.getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from(
    { length: Math.ceil((monthOffset + dayCount) / 7) * 7 },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i - monthOffset + 1),
  );
  const monthName = `${month.getFullYear()} оны ${month.getMonth() + 1}-р сар`;
  const cycleStart = lastPeriodStart ? new Date(`${lastPeriodStart}T00:00:00`) : null;
  const selected = new Date(`${selectedDate}T00:00:00`);
  const selectedPeriodLength = cycleStart ? Math.round((selected - cycleStart) / 86400000) + 1 : 0;
  const canCorrectStart = Boolean(lastPeriodStart) && selectedDate !== lastPeriodStart;
  const canCorrectEnd = selectedPeriodLength > 0 && selectedPeriodLength <= 14 && selectedPeriodLength !== periodLength;
  const cycleDay = cycleStart
    ? ((Math.floor((selected - cycleStart) / 86400000) % cycleLength) + cycleLength) % cycleLength + 1
    : null;
  const selectedLog = flat(logs[selectedDate]);
  const active = categories.find((category) => category.id === activeCategory);
  const nextPeriodDate = cycleStart && cycleLength
    ? new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate() + cycleLength)
    : null;
  const nextPeriodLabel = nextPeriodDate ? dateLabel(nextPeriodDate) : null;
  const daysToNext = nextPeriodDate ? Math.round((nextPeriodDate - new Date(`${today}T00:00:00`)) / 86400000) : null;
  const prePeriodTrends = { emotion: {}, symptoms: {} };
  if (cycleStart && cycleLength) {
    Object.entries(logs).forEach(([dateKey, dayLog]) => {
      if (dateKey > today) return;
      const date = new Date(`${dateKey}T00:00:00`);
      const diff = Math.floor((date - cycleStart) / 86400000);
      const cycleOffset = ((diff % cycleLength) + cycleLength) % cycleLength;
      if (cycleOffset < Math.max(0, cycleLength - 7)) return;
      ["emotion", "symptoms"].forEach((categoryId) => {
        const value = flat(dayLog)[categoryId];
        if (value) prePeriodTrends[categoryId][value] = (prePeriodTrends[categoryId][value] ?? 0) + 1;
      });
    });
  }
  const mostCommon = (values) => Object.entries(values).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const commonEmotion = mostCommon(prePeriodTrends.emotion);
  const commonSymptoms = Object.entries(prePeriodTrends.symptoms).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([value]) => value);

  // Өдөр бүрийн төрөл: "period" (ирсэн) · "predicted" (таамаг) · "ovulation" · null
  const todayDate = new Date(`${today}T00:00:00`);
  const dayKind = (date, key) => {
    if (selectedValueIsPeriod(flat(logs[key]).period)) return "period";
    if (!cycleStart || !cycleLength || !periodLength) return null;
    const diff = Math.floor((date - cycleStart) / 86400000);
    if (diff < -cycleLength * 3) return null; // хэт эртний өдрүүдийг будахгүй
    const day = (((diff % cycleLength) + cycleLength) % cycleLength) + 1;
    const ovDay = cycleLength - 14;
    if (day <= periodLength) {
      if (diff >= 0 && diff < periodLength && date <= todayDate) return "period";
      return date > todayDate ? "predicted" : null; // өнгөрсөн өдрийг таамаглахгүй (тэмдэглэснээр л харагдана)
    }
    if (day >= ovDay - 1 && day <= ovDay + 1) return "ovulation";
    return null;
  };

  const selectDate = (date) => {
    const key = localDateKey(date);
    setSelectedDate(key);
    setNote(window.localStorage.getItem(`bloom:private-note:${key}`) ?? "");
    if (date.getMonth() !== month.getMonth()) setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setActiveCategory(null);
    setShowCorrection(false);
    setSheetOpen(true);
  };

  const chooseValue = (categoryId, value) => {
    const next = { ...selectedLog };
    if (next[categoryId] === value) delete next[categoryId]; // дахин дарвал болино
    else next[categoryId] = value;
    const all = { ...logs, [selectedDate]: next };
    setLogs(all);
    window.localStorage.setItem(`bloom:tracker-log:${selectedDate}`, JSON.stringify(next));
    setActiveCategory(null);
  };

  const saveNote = () => {
    const key = `bloom:private-note:${selectedDate}`;
    const nextDates = new Set(noteDates);
    if (note.trim()) {
      window.localStorage.setItem(key, note.trim());
      nextDates.add(selectedDate);
    } else {
      window.localStorage.removeItem(key);
      nextDates.delete(selectedDate);
    }
    setNoteDates(nextDates);
    setToast("Тэмдэглэл хадгалагдлаа");
    setSheetOpen(false);
  };

  const generateCycleSummary = async () => {
    setSummaryLoading(true);
    setSummaryError("");
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 180);
    const cutoffKey = localDateKey(cutoffDate);
    const dailyLogs = Object.entries(logs)
      .filter(([date]) => date >= cutoffKey && date <= today)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, entries]) => ({ date, AM: flat(entries), PM: {} }));
    const result = await askAi(session, {
      type: "cycle_summary",
      cycleLength,
      periodLength,
      lastPeriodStart,
      logs: dailyLogs,
    }, 30000, { detailed: true });
    if (result?.summary) setCycleSummary(result);
    else {
      const errors = {
        ai_not_configured: "Серверт ANTHROPIC_API_KEY тохируулаагүй байна. API түлхүүрээ серверийн орчинд нэмээд дахин асаах эсвэл deploy хийнэ үү.",
        unauthorized: "Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрч оролдоорой.",
        ai_failed: "AI үйлчилгээ хүсэлтэд хариу өгсөнгүй. Серверийн API түлхүүр, model тохиргоог шалгана уу.",
        bad_ai_output: "AI хариуны формат буруу ирлээ. Дахин оролдоно уу.",
        timeout: "AI хариу удааширлаа. Интернэтээ шалгаад дахин оролдоорой.",
        network_error: "Сервертэй холбогдож чадсангүй. Интернэт болон серверээ шалгана уу.",
      };
      setSummaryError(errors[result?.error] ?? "Дүгнэлт гаргаж чадсангүй. Серверийн тохиргоог шалгаад дахин оролдоорой.");
    }
    setSummaryLoading(false);
  };

  const correctStartDate = async () => {
    const ok = selectedDate === today
      ? await startPeriod()
      : await saveCycle({ lastPeriodStart: selectedDate, cycleLength, periodLength });
    if (ok && selectedDate !== today) setToast("Мөчлөгийн эхлэх өдрийг шинэчиллээ.");
    if (ok) setShowCorrection(false);
  };

  const correctEndDate = async () => {
    const endLength = Math.round((selected - cycleStart) / 86400000) + 1;
    const ok = await saveCycle({ lastPeriodStart, cycleLength, periodLength: endLength });
    if (ok) setToast("Сарын тэмдэг дууссан өдрийг шинэчиллээ.");
    if (ok) setShowCorrection(false);
  };

  const monthLogDates = useMemo(
    () => new Set([...Object.keys(logs).filter((k) => Object.keys(flat(logs[k])).length), ...noteDates]),
    [logs, noteDates],
  );

  return (
    <main data-theme={theme} className="cycle-tracker fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#111018] px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(14px,env(safe-area-inset-top))] text-[#f4edf6]">
      <div className="mx-auto max-w-md space-y-3">
        <header className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Буцах" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#211c29] text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-black">Миний мөчлөг</h1>
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            role="switch" aria-checked={theme === "dark"}
            aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
            className="ml-auto flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-extrabold text-[#cbb6d9] transition active:scale-95">
            <span className={`relative h-6 w-11 rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-[#e0679f]" : "bg-[#d8ccdf]"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`}>
                {theme === "dark" ? <Moon className="h-3 w-3 text-[#b83b7e]" /> : <Sun className="h-3 w-3 text-[#80658a]" />}
              </span>
            </span>
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </header>

        {/* ---------- Мөчлөгийн мэдээлэл ---------- */}
        <section className="overflow-hidden rounded-[22px] border border-[#765482] bg-gradient-to-br from-[#382943] via-[#2a2233] to-[#211b29] p-2.5 shadow-[0_10px_26px_rgba(8,4,14,0.36)]">
          {lastPeriodStart ? (
            <dl className="grid grid-cols-3 gap-2">
              {[
                ["Сүүлд эхэлсэн", lastPeriodStart.slice(5).replace("-", "/")],
                ["Мөчлөг", `${cycleLength} хоног`],
                ["Үргэлжлэх", `${periodLength} хоног`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#5a4662] bg-[#342a3b] px-1.5 py-2 text-center shadow-sm shadow-black/10">
                  <dt className="text-[9px] font-bold leading-3 text-[#c6b5cf]">{label}</dt>
                  <dd className="mt-1 text-[13px] font-black leading-4 text-white">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-2xl bg-white/[0.035] px-3 py-3 text-xs font-semibold text-[#c1b4ca]">Мөчлөгийн мэдээлэл оруулаагүй байна.</p>
          )}
          <button type="button" onClick={() => setEditingCycle(true)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#805d8a] bg-[#46344f] py-2 text-[11px] font-extrabold text-white transition hover:bg-[#543d60] active:scale-[.98]">
            <Pencil className="h-3 w-3 text-[#e2bdff]" />
            {lastPeriodStart ? "Мэдээлэл засах" : "Мөчлөгөө тохируулах"}
          </button>
        </section>

        {/* ---------- Календарь ---------- */}
        <section className="rounded-[24px] border border-[#302838] bg-[#1a1721] p-3">
          <div className="mb-1 flex items-center justify-between">
            <button type="button" onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} aria-label="Өмнөх сар" className="rounded-xl p-2 text-[#b7a8c2] hover:bg-[#2a2332]"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-sm font-extrabold">{monthName}</h2>
            <button type="button" onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} aria-label="Дараагийн сар" className="rounded-xl p-2 text-[#b7a8c2] hover:bg-[#2a2332]"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-[#968b9e]">
            {WEEKDAYS.map((d) => <span key={d} className="py-1.5">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((date) => {
              const key = localDateKey(date);
              const inMonth = date.getMonth() === month.getMonth();
              const isToday = key === today;
              const kind = dayKind(date, key);
              const logged = monthLogDates.has(key);
              const style =
                kind === "period"
                  ? "bg-[#e96691] font-extrabold text-white"
                  : kind === "predicted"
                    ? "border-2 border-dashed border-[#f4a1ba] text-[#f4a1ba]"
                    : kind === "ovulation"
                      ? "bg-[#3a3158] text-[#cdb5ff]"
                      : inMonth
                        ? "text-[#e8dfed] hover:bg-[#2a2332]"
                        : "text-[#62596b]";
              return (
                <button key={key} type="button" onClick={() => selectDate(date)}
                  aria-label={`${dateLabel(date)}${kind === "period" ? ", сарын тэмдэг" : kind === "predicted" ? ", таамаг" : kind === "ovulation" ? ", овуляци" : ""}${logged ? ", тэмдэглэлтэй" : ""}`}
                  className={`cycle-day relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition active:scale-90 ${style} ${!inMonth ? "opacity-40" : ""} ${isToday ? "cycle-today outline outline-2 outline-offset-2 outline-white/70" : ""}`}>
                  <span>{date.getDate()}</span>
                  {logged && (
                    <span className={`absolute -bottom-1.5 h-1.5 w-1.5 rounded-full ${kind === "period" ? "bg-[#ffd1e0]" : "bg-[#a78bfa]"}`} />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#a99eaf]">
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#e96691]" /> Сарын тэмдэг</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-[#f4a1ba]" /> Таамаг</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-[#3a3158] ring-1 ring-[#cdb5ff]" /> Овуляци</span>
            <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]" /> Тэмдэглэсэн</span>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#7d7286]">Өдөр дээр дарж тэмдэглэнэ</p>
        </section>

        {/* ---------- Дараагийн мөчлөг ---------- */}
        <section className="flex items-center gap-3 rounded-[24px] border border-[#49313f] bg-gradient-to-br from-[#2b202d] to-[#211b29] p-3">
          <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#3a2534] text-[#ffb6cf]">
            <span className="text-base font-black leading-none">{daysToNext != null && daysToNext >= 0 ? daysToNext : "–"}</span>
            <span className="text-[9px] font-bold">хоног</span>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[#f3c2d3]">{nextPeriodLabel ? `Дараагийнх: ${nextPeriodLabel}` : "Мөчлөгөө оруулаарай"}</p>
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

      {editingCycle && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-50 px-4 pt-[max(14px,env(safe-area-inset-top))]">
          <div className="mx-auto max-w-md">
            <button type="button" onClick={() => setEditingCycle(false)} className="mb-2 inline-flex h-9 items-center gap-2 rounded-full bg-[#211c29]/70 px-3 text-sm font-bold text-[#cbb6d9] transition hover:bg-[#3a2d41] hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Буцах
            </button>
            <CycleSetup onDone={() => setEditingCycle(false)} />
          </div>
        </div>
      )}

      {/* ---------- Өдөр дээр дарахад гарч ирэх цонх ---------- */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={dateLabel(selected)}
            onClick={(e) => e.stopPropagation()}
            className="bloom-pop max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] border-t border-[#3b3242] bg-[#1a1721] px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2"
          >
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-[#3b3242]" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-black">{dateLabel(selected)}</h2>
                {cycleDay && <p className="text-xs font-extrabold text-[#e58da9]">Мөчлөгийн {cycleDay}-р өдөр</p>}
              </div>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Хаах" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#292331] text-[#b9adbf]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1">
              {categories.map(({ id, name, icon: Icon }) => {
                const value = selectedLog[id];
                return (
                  <button key={id} type="button" onClick={() => setActiveCategory(activeCategory === id ? null : id)} className="flex min-w-0 flex-col items-center gap-1 text-center">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full border text-lg ${activeCategory === id ? "border-[#f28eae] bg-[#4b2b3b] text-[#ffabc4]" : value ? "border-[#6b4a5c] bg-[#3a2a36] text-[#ffc4d6]" : "border-[#383140] bg-[#292431] text-[#c4b4d0]"}`}>
                      {value && valueEmoji[value] ? valueEmoji[value] : <Icon className="h-5 w-5" />}
                    </span>
                    <span className="w-full truncate text-[10px] font-bold text-[#d5cbdc]">{value ? mn(value) : name}</span>
                  </button>
                );
              })}
            </div>

            {active && (
              <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-[#211c29] p-3">
                {active.options.map((value) => (
                  <button key={value} type="button" onClick={() => chooseValue(active.id, value)}
                    className={`rounded-full px-3 py-2 text-xs font-bold ${selectedLog[active.id] === value ? "bg-[#e96691] text-white" : "bg-[#342c3b] text-[#e1d7e7]"}`}>
                    {valueEmoji[value] ? `${valueEmoji[value]} ` : ""}{mn(value)}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs font-extrabold text-[#bbaec4]">
              <BookOpen className="h-4 w-4" /> Тэмдэглэл
            </div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={500}
              placeholder="Өнөөдөр юу болов?"
              className="mt-2 w-full resize-none rounded-2xl border border-[#3b3242] bg-[#211c29] px-3 py-2.5 text-sm text-[#f4edf6] outline-none placeholder:text-[#776a7a] focus:border-[#e96691]" />
            <button type="button" onClick={saveNote} className="mt-2 w-full rounded-2xl bg-[#e96691] py-3 text-sm font-extrabold text-white active:scale-95">
              Хадгалах
            </button>

            {lastPeriodStart && selectedDate <= today && (canCorrectStart || canCorrectEnd) && (
              <div className="mt-3">
                {!showCorrection ? (
                  <button type="button" onClick={() => setShowCorrection(true)} className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#a99eaf]">
                    <Pencil className="h-3.5 w-3.5" /> Сарын тэмдгийн огноо засах
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {canCorrectStart && <button type="button" onClick={correctStartDate} className="rounded-xl bg-[#382532] px-3 py-2.5 text-xs font-bold text-[#f2a5c9]">Энэ өдөр эхэлсэн</button>}
                    {canCorrectEnd && <button type="button" onClick={correctEndDate} className="rounded-xl bg-[#2a2435] px-3 py-2.5 text-xs font-bold text-[#cab5f0]">Энэ өдөр дууссан</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function selectedValueIsPeriod(value) {
  return value && value !== "None";
}
