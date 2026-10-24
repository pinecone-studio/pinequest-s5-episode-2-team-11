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
} from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { askAi } from "../../../lib/ai-client";

const localDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const categories = [
  { id: "emotion", title: "Emotions", name: "Сэтгэл хөдлөл", icon: Heart, options: ["Happy", "Calm", "Sad", "Anxious", "Embarrassed", "Irritable"] },
  { id: "skin", title: "Skin", name: "Арьс", icon: Sparkles, options: ["Clear", "Spots", "Oily", "Dry", "Sensitive"] },
  { id: "symptoms", title: "Symptoms", name: "Шинж тэмдэг", icon: Activity, options: ["Cramps", "Headache", "Bloating", "Fatigue", "Tenderness"] },
  { id: "period", title: "Period", name: "Сарын тэмдэг", icon: Droplets, options: ["None", "Spotting", "Light", "Medium", "Heavy"] },
  { id: "sleep", title: "Sleep", name: "Нойр", icon: Moon, options: ["Poor", "Okay", "Good", "Great"] },
];

const trackerValueMn = {
  Happy: "Баяртай",
  Calm: "Тайван",
  Sad: "Гунигтай",
  Anxious: "Түгшсэн",
  Embarrassed: "Ичиж зовсон",
  Irritable: "Цочромтгой",
  Cramps: "Базлалт",
  Headache: "Толгой өвдөх",
  Bloating: "Гэдэс дүүрэх",
  Fatigue: "Ядаргаа",
  Tenderness: "Хөндүүрлэх",
};

function ordinal(day) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  return `${day}${({ 1: "st", 2: "nd", 3: "rd" })[day % 10] ?? "th"}`;
}

function englishDate(date) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  return `${weekday} ${ordinal(date.getDate())} ${month} ${date.getFullYear()}`;
}

export default function PeriodCycleTracker({ onBack, cycleLength, periodLength, lastPeriodStart }) {
  const { saveCycle, startPeriod, setToast, session } = useFamily();
  const [today] = useState(() => localDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [logs, setLogs] = useState({});
  const [note, setNote] = useState("");
  const [slot, setSlot] = useState("AM");
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [cycleSummary, setCycleSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    const prefix = "bloom:tracker-log:";
    const result = Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .reduce((all, key) => {
        try { all[key.slice(prefix.length)] = JSON.parse(window.localStorage.getItem(key)); } catch { /* skip bad entry */ }
        return all;
      }, {});
    setLogs(result);
    setNote(window.localStorage.getItem(`bloom:private-note:${selectedDate}`) ?? "");
  }, []);

  const monthOffset = (month.getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from(
    { length: Math.ceil((monthOffset + dayCount) / 7) * 7 },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i - monthOffset + 1),
  );
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month);
  const cycleStart = lastPeriodStart ? new Date(`${lastPeriodStart}T00:00:00`) : null;
  const selected = new Date(`${selectedDate}T00:00:00`);
  const selectedPeriodLength = cycleStart ? Math.round((selected - cycleStart) / 86400000) + 1 : 0;
  const canCorrectStart = Boolean(lastPeriodStart) && selectedDate !== lastPeriodStart;
  const canCorrectEnd = selectedPeriodLength > 0 && selectedPeriodLength <= 14 && selectedPeriodLength !== periodLength;
  const cycleDay = cycleStart
    ? ((Math.floor((selected - cycleStart) / 86400000) % cycleLength) + cycleLength) % cycleLength + 1
    : null;
  const selectedLog = logs[selectedDate] ?? { AM: {}, PM: {} };
  const active = categories.find((category) => category.id === activeCategory);
  const nextPeriodDate = cycleStart && cycleLength
    ? new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate() + cycleLength)
    : null;
  const nextPeriodLabel = nextPeriodDate
    ? new Intl.DateTimeFormat("mn-MN", { weekday: "long", day: "numeric", month: "long" }).format(nextPeriodDate)
    : null;
  const prePeriodTrends = { emotion: {}, symptoms: {} };
  if (cycleStart && cycleLength) {
    Object.entries(logs).forEach(([dateKey, dayLog]) => {
      if (dateKey > today) return;
      const date = new Date(`${dateKey}T00:00:00`);
      const diff = Math.floor((date - cycleStart) / 86400000);
      const cycleOffset = ((diff % cycleLength) + cycleLength) % cycleLength;
      if (cycleOffset < Math.max(0, cycleLength - 7)) return;
      ["AM", "PM"].forEach((time) => {
        ["emotion", "symptoms"].forEach((categoryId) => {
          const value = dayLog?.[time]?.[categoryId];
          if (value) prePeriodTrends[categoryId][value] = (prePeriodTrends[categoryId][value] ?? 0) + 1;
        });
      });
    });
  }
  const mostCommon = (values) => Object.entries(values).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const commonEmotion = mostCommon(prePeriodTrends.emotion);
  const commonSymptoms = Object.entries(prePeriodTrends.symptoms).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([value]) => value);

  const isPredictedPeriodDay = (date) => {
    if (!cycleStart || !cycleLength || !periodLength) return false;
    const diff = Math.floor((date - cycleStart) / 86400000);
    return ((diff % cycleLength) + cycleLength) % cycleLength < periodLength;
  };

  const selectDate = (date) => {
    const key = localDateKey(date);
    setSelectedDate(key);
    setNote(window.localStorage.getItem(`bloom:private-note:${key}`) ?? "");
    if (date.getMonth() !== month.getMonth()) setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setActiveCategory(null);
    setShowCorrection(false);
  };

  const chooseValue = (categoryId, value) => {
    const previous = logs[selectedDate] ?? { AM: {}, PM: {} };
    const next = { AM: { ...previous.AM }, PM: { ...previous.PM } };
    next[slot][categoryId] = value;
    const all = { ...logs, [selectedDate]: next };
    setLogs(all);
    window.localStorage.setItem(`bloom:tracker-log:${selectedDate}`, JSON.stringify(next));
    setActiveCategory(null);
  };

  const saveNote = () => {
    const key = `bloom:private-note:${selectedDate}`;
    if (note.trim()) window.localStorage.setItem(key, note.trim());
    else window.localStorage.removeItem(key);
    setToast("Өдрийн тэмдэглэл хадгалагдлаа.");
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
      .map(([date, entries]) => ({ date, AM: entries?.AM ?? {}, PM: entries?.PM ?? {} }));
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

  const monthLogDates = useMemo(() => new Set(Object.keys(logs)), [logs]);

  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#111018] px-4 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] text-[#f4edf6]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-5 flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Буцах" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#211c29] text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#aaa0b3]">Bloomy · period tracker</p>
            <h1 className="text-xl font-black">Мөчлөг ба өдрийн тэмдэглэл</h1>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <section className="relative rounded-[28px] border border-[#302838] bg-[#1a1721] p-4 shadow-xl">
          {lastPeriodStart && selectedDate <= today && (
            <button type="button" onClick={() => setShowCorrection((open) => !open)} aria-label="Мөчлөгийн огноо засах" aria-expanded={showCorrection}
              className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition ${showCorrection ? "bg-[#563047] text-[#ffb6cf]" : "bg-[#292331] text-[#b9adbf] hover:bg-[#382d3e] hover:text-white"}`}>
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="mb-3 flex items-center justify-between pr-9">
            <button type="button" onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} aria-label="Өмнөх сар" className="rounded-xl p-2 text-[#b7a8c2] hover:bg-[#2a2332]"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="font-extrabold">{monthName}</h2>
            <button type="button" onClick={() => setMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} aria-label="Дараагийн сар" className="rounded-xl p-2 text-[#b7a8c2] hover:bg-[#2a2332]"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-extrabold uppercase text-[#968b9e]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="py-2">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((date) => {
              const key = localDateKey(date);
              const inMonth = date.getMonth() === month.getMonth();
              const chosen = key === selectedDate;
              const actualPeriod = ["AM", "PM"].some((time) => selectedValueIsPeriod(logs[key]?.[time]?.period));
              const predictedPeriod = !actualPeriod && isPredictedPeriodDay(date);
              const periodMark = actualPeriod || predictedPeriod;
              return (
                <button key={key} type="button" onClick={() => selectDate(date)} aria-label={`${key}${actualPeriod ? ", period logged" : predictedPeriod ? ", predicted period" : ""}${monthLogDates.has(key) ? ", logged" : ""}`}
                  className={`relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm font-semibold transition ${
                    chosen ? "bg-[#e96691] text-white shadow-lg shadow-pink-900/30" : actualPeriod ? "bg-[#563047] font-extrabold text-[#ffb6cf] ring-1 ring-inset ring-[#f06b83]" : predictedPeriod ? "text-[#f4a1ba] ring-1 ring-inset ring-[#a86b82]" : inMonth ? "text-[#e8dfed] hover:bg-[#2a2332]" : "text-[#62596b]"
                  }`}>
                  <span>{date.getDate()}</span>
                  {actualPeriod && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${chosen ? "bg-white" : "bg-[#ff9dbd]"}`} />}
                  {predictedPeriod && <span className={`absolute bottom-1 h-1 w-1 rounded-full border ${chosen ? "border-white" : "border-[#e8a8bd]"}`} />}
                  {monthLogDates.has(key) && !periodMark && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#a78bfa]" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-[#a99eaf]">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#f06b83]" /> Ирсэн өдөр</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full border border-[#a86b82]" /> Тооцоолсон өдөр</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#a78bfa]" /> Бүртгэлтэй өдөр</span>
          </div>
          {showCorrection && lastPeriodStart && selectedDate <= today && (
            <div className="mt-4 rounded-2xl border border-[#3b3242] bg-[#211c29] p-3">
              <p className="mb-2 text-xs font-extrabold text-[#c9bdcf]">{selectedDate} өдрийн мөчлөгийн огноог засах</p>
              {canCorrectStart && <button type="button" onClick={correctStartDate} className="w-full rounded-xl bg-[#382532] px-3 py-2.5 text-left text-xs font-bold text-[#f2a5c9]">Энэ өдөр сарын тэмдэг эхэлсэн</button>}
              {canCorrectEnd && <button type="button" onClick={correctEndDate} className={`${canCorrectStart ? "mt-2 " : ""}w-full rounded-xl bg-[#2a2435] px-3 py-2.5 text-left text-xs font-bold text-[#cab5f0]`}>Энэ өдөр сарын тэмдэг дууссан</button>}
              {!canCorrectStart && !canCorrectEnd && <p className="text-xs text-[#968b9e]">Энэ өдрөөр засах огнооны өөрчлөлт алга.</p>}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-[#302838] bg-[#1a1721] p-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="font-black">{englishDate(selected)}</h2>
              <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#e58da9]">
                {cycleDay ? `Cycle day ${cycleDay}` : "Cycle day not set"}
              </p>
            </div>
            <div className="flex rounded-full bg-[#292331] p-1">
              {["AM", "PM"].map((time) => <button key={time} type="button" onClick={() => { setSlot(time); setActiveCategory(null); }} className={`rounded-full px-3 py-1.5 text-xs font-black ${slot === time ? "bg-[#e96691] text-white" : "text-[#b9adbf]"}`}>{time}</button>)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {categories.map(({ id, title, name, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveCategory(activeCategory === id ? null : id)} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full border ${activeCategory === id ? "border-[#f28eae] bg-[#4b2b3b] text-[#ffabc4]" : "border-[#383140] bg-[#292431] text-[#c4b4d0]"}`}><Icon className="h-5 w-5" /></span>
                <span className="text-[10px] font-bold leading-tight text-[#d5cbdc]">{title}</span>
                <span className="line-clamp-1 text-[9px] text-[#887d90]">{selectedLog[slot]?.[id] ?? name}</span>
              </button>
            ))}
          </div>

          {active && (
            <div className="mt-4 rounded-2xl border border-[#3b3242] bg-[#211c29] p-3">
              <p className="mb-2 text-xs font-extrabold text-[#d9cce1]">{active.name} · {slot}</p>
              <div className="flex flex-wrap gap-2">
                {active.options.map((value) => <button key={value} type="button" onClick={() => chooseValue(active.id, value)} className={`rounded-full px-3 py-2 text-xs font-bold ${selectedLog[slot]?.[active.id] === value ? "bg-[#e96691] text-white" : "bg-[#342c3b] text-[#e1d7e7]"}`}>{value}</button>)}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {["AM", "PM"].map((time) => (
              <div key={time} className="rounded-2xl border border-[#332c3b] bg-[#211c29] p-3">
                <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-[#bbaec4]">{time === "AM" ? "Өглөө · AM" : "Орой · PM"}</h3>
                {Object.keys(selectedLog[time] ?? {}).length ? (
                  <div className="space-y-1.5">
                    {categories.filter((category) => selectedLog[time]?.[category.id]).map((category) => (
                      <div key={category.id} className="flex items-center justify-between rounded-xl bg-[#2a2431] px-3 py-2 text-xs">
                        <span className="text-[#aa9fb3]">{category.title}</span><span className="font-bold text-[#f2e9f4]">{selectedLog[time][category.id]}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs font-medium text-[#716879]">Одоогоор бүртгэл алга</p>}
              </div>
            ))}
          </div>

        </section>
        </div>

        <section className="mt-4 rounded-[28px] border border-[#49313f] bg-gradient-to-br from-[#2b202d] to-[#211b29] p-4 text-[#f4edf6]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#f19ab8]" />
            <h2 className="font-black">Миний дараагийн мөчлөг</h2>
          </div>
          {nextPeriodLabel ? (
            <>
              <p className="mt-2 text-sm font-bold text-[#f3c2d3]">Сарын тэмдэг ойролцоогоор {nextPeriodLabel}-нд ирж магадгүй.</p>
              {commonEmotion || commonSymptoms.length ? (
                <p className="mt-2 text-sm leading-relaxed text-[#d2c5d7]">
                  Өмнөх мөчлөгийн сүүлийн өдрүүдэд {commonEmotion ? `“${trackerValueMn[commonEmotion] ?? commonEmotion}” мэдрэмж` : "сэтгэл хөдлөлөө"}{commonSymptoms.length ? `, ${commonSymptoms.map((value) => trackerValueMn[value] ?? value).join(" болон ")} шинж тэмдэг` : ""} бүртгэжээ. Дараагийн мөчлөгт яг адил байна гэсэн баталгаа биш шүү.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-[#b9adbf]">Мөчлөгийн өмнөх өдрүүдээ тэмдэглэж эхэлбэл энд өмнөх бүртгэлүүдийн хэв маягийг харуулна.</p>
              )}
            </>
          ) : <p className="mt-2 text-sm text-[#b9adbf]">Мөчлөгийн мэдээллээ оруулбал дараагийн өдрийг тооцоолж харуулна.</p>}
        </section>

        <section className="mt-4 rounded-[28px] border border-[#49313f] bg-[#1a1721] p-4 text-[#f4edf6]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#c8a4ed]" />
            <h2 className="font-black">Мөчлөгийн AI дүгнэлт</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#b9adbf]">
            Товчийг дарахад сүүлийн 180 хоногийн ангилсан бүртгэл AI үйлчилгээнд боловсруулахаар илгээгдэнэ. Хувийн өдрийн тэмдэглэлийн бичвэрийг оруулахгүй, асран хамгаалагчтай хуваалцахгүй.
          </p>
          <button type="button" onClick={generateCycleSummary} disabled={summaryLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#80658a] py-3 text-sm font-extrabold text-white disabled:opacity-60">
            {summaryLoading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Дүгнэлт гаргаж байна…</> : <><Sparkles className="h-4 w-4" /> Миний бүртгэлд дүгнэлт гаргах</>}
          </button>
          {summaryError && <p role="alert" className="mt-3 text-sm font-semibold text-[#f3a2b2]">{summaryError}</p>}
          {cycleSummary && (
            <div className="mt-4 space-y-3 rounded-2xl border border-[#383040] bg-[#211c29] p-3 text-sm leading-relaxed">
              <p className="font-bold text-[#f2d5e3]">{cycleSummary.summary}</p>
              {[["Сарын тэмдгийн өмнө", cycleSummary.beforePeriod], ["Сарын тэмдгийн үеэр", cycleSummary.duringPeriod], ["Дараах өдрүүдэд", cycleSummary.afterPeriod], ["Сэтгэл санаа", cycleSummary.mood], ["Биеийн байдал", cycleSummary.body]].map(([title, value]) => value && (
                <p key={title}><span className="font-extrabold text-[#cdb5dc]">{title}: </span><span className="text-[#ddd2e2]">{value}</span></p>
              ))}
              {cycleSummary.dataQuality && <p className="border-t border-[#383040] pt-2 text-xs text-[#a99eaf]">{cycleSummary.dataQuality}</p>}
            </div>
          )}
        </section>

        <section className="relative mt-4 overflow-hidden rounded-[28px] border border-[#e8dcc8] bg-[#fbf6ec] p-4 text-[#352d3a] shadow-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe2f0] text-[#805f89]"><BookOpen className="h-5 w-5" /></span>
            <div>
              <h2 className="font-black text-[#35253a]">Миний өдрийн тэмдэглэл</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#66566b]">Өнөөдрийн бодол, үйл явдлаа бичээрэй</p>
            </div>
          </div>
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fffaf1]">
            <div aria-hidden="true" className="pointer-events-none absolute bottom-4 left-3 top-4 flex flex-col justify-between">
              {[0, 1, 2, 3].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-[#e7d8c6]" />)}
            </div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={6}
              placeholder="Өнөөдөр юу болсон бэ? Юу чамайг баярлуулж, юу бодогдуулав?"
              className="journal-note-input relative z-10 min-h-44 w-full resize-y border-0 bg-transparent py-2 pl-9 pr-3 text-sm leading-8 text-[#352d3a] outline-none placeholder:text-[#776a7a]"
              style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, #eadfce 32px)", backgroundPosition: "0 8px" }} />
          </div>
          <button type="button" onClick={saveNote} className="mt-3 w-full rounded-2xl bg-[#80658a] py-3 text-sm font-extrabold text-white shadow-sm active:scale-[.99]">
            Дэвтэртээ хадгалах
          </button>
        </section>

      </div>
    </main>
  );
}

function selectedValueIsPeriod(value) {
  return value && value !== "None";
}
