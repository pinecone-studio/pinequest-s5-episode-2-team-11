"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Check, Clock3, Settings2, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
import { localDateKey, periodDayKeys, predictPeriodRange, dateLabelMongolian } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";
import BottomSheet from "../ui/BottomSheet";
import DayDetailSheet from "./DayDetailSheet";

const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const DAY_MS = 86_400_000;

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  return [...Array(mondayOffset).fill(null), ...Array.from({ length: days }, (_, index) => new Date(year, month, index + 1))];
}

function shiftDateKey(key, amount) {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

function startsFromDays(days) {
  return [...days].filter((key) => !days.has(shiftDateKey(key, -1))).sort();
}

function periodDayNumber(dateKey, starts) {
  const start = [...starts].filter((item) => item <= dateKey).sort().at(-1);
  return start ? Math.round((new Date(`${dateKey}T00:00:00`) - new Date(`${start}T00:00:00`)) / DAY_MS) + 1 : null;
}

function dateLabelWithMonth(date) {
  return dateLabelMongolian(date);
}

function scrollMonthBelowStickyBars(container, target) {
  if (!container || !target) return;
  const safeTop = Number.parseFloat(getComputedStyle(container).getPropertyValue("--calendar-safe-top")) || 0;
  const stickyHeight = safeTop + 56 + 32;
  const containerTop = container.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  container.scrollTo({ top: container.scrollTop + targetTop - containerTop - stickyHeight, behavior: "auto" });
}

export default function PeriodCycleTracker({ onBack, onDayPress, cycleLength: cycleLengthProp, periodLength: periodLengthProp }) {
  const {
    profile, session, periodStarts, periodLogs, noPeriodYet, savePeriodStartDates,
    saveCycle, startPeriod, setToast,
  } = useFamily();
  const { theme } = useTheme();
  const today = localDateKey(new Date());
  const currentMonth = useMemo(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1), []);
  const [anchorMonth, setAnchorMonth] = useState(currentMonth);
  const [viewMode, setViewMode] = useState("month");
  const [selectedYear, setSelectedYear] = useState(currentMonth.getFullYear());
  const [selectedDate, setSelectedDate] = useState("");
  const [dots, setDots] = useState({});
  const [editing, setEditing] = useState(false);
  const [draftDays, setDraftDays] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cycleDraft, setCycleDraft] = useState(cycleLengthProp ?? 28);
  const [periodDraft, setPeriodDraft] = useState(periodLengthProp ?? 5);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);
  const mainRef = useRef(null);
  const monthRefs = useRef({});

  const months = useMemo(() => Array.from({ length: 16 }, (_, index) => {
    const date = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + index - 12, 1);
    return { date, key: monthKey(date), dates: monthDates(date) };
  }), [anchorMonth]);
  const rangeStart = localDateKey(months[0].date);
  const rangeEnd = localDateKey(new Date(months.at(-1).date.getFullYear(), months.at(-1).date.getMonth() + 1, 0));
  const activeStarts = editing ? startsFromDays(draftDays) : periodStarts;
  const hasPeriod = !noPeriodYet && activeStarts.length > 0;
  const periodLength = Number(periodDraft || periodLengthProp || 5);
  const prediction = predictPeriodRange({ starts: hasPeriod ? activeStarts : [], today, hasHadPeriod: hasPeriod });
  const actualPeriodDays = useMemo(() => periodDayKeys(hasPeriod ? activeStarts : [], periodLength, today), [hasPeriod, activeStarts, periodLength, today]);
  const predictedPeriodDays = useMemo(() => {
    const days = new Set();
    if (!hasPeriod || !prediction.rangeStart || !prediction.rangeEnd) return days;
    for (let key = prediction.rangeStart; key <= prediction.rangeEnd; key = shiftDateKey(key, 1)) days.add(key);
    return days;
  }, [hasPeriod, prediction.rangeStart, prediction.rangeEnd]);
  const pendingByDate = useMemo(() => Object.fromEntries((periodLogs ?? []).filter((item) => item.status === "pending").map((item) => [item.log_date, item])), [periodLogs]);

  useEffect(() => {
    const target = monthRefs.current[monthKey(currentMonth)];
    if (viewMode === "month" && target) requestAnimationFrame(() => scrollMonthBelowStickyBars(mainRef.current, target));
  }, [viewMode, anchorMonth, currentMonth]);

  // One dot per logged category; refetched as soon as any entry is saved or deleted.
  useEffect(() => {
    if (!supabase || !profile?.id) return;
    let cancelled = false;
    const load = () => fetchEntries(supabase, rangeStart, rangeEnd).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[log_entries] calendar dots:", error.message);
      setDots(categoriesByDate(data));
    });
    load();
    window.addEventListener(LOG_ENTRIES_CHANGED, load);
    return () => { cancelled = true; window.removeEventListener(LOG_ENTRIES_CHANGED, load); };
  }, [profile?.id, rangeStart, rangeEnd]);

  useEffect(() => {
    const scrollMain = mainRef.current;
    if (!scrollMain) return;
    const updateYear = () => {
      const items = Object.entries(monthRefs.current).map(([key, element]) => ({ key, element })).filter(({ element }) => element);
      const visible = items.find(({ element }) => element.getBoundingClientRect().bottom > 116);
      if (visible) setSelectedYear(Number(visible.key.slice(0, 4)));
    };
    scrollMain.addEventListener("scroll", updateYear, { passive: true });
    return () => scrollMain.removeEventListener("scroll", updateYear);
  }, [viewMode, months]);

  const openMonth = useCallback((date) => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    setAnchorMonth(first);
    setSelectedYear(first.getFullYear());
    setViewMode("month");
    requestAnimationFrame(() => requestAnimationFrame(() => scrollMonthBelowStickyBars(mainRef.current, monthRefs.current[monthKey(first)])));
  }, []);

  const beginEdit = () => {
    setDraftDays(new Set(actualPeriodDays));
    if (viewMode === "year") {
      const focus = selectedYear === currentMonth.getFullYear() ? currentMonth : new Date(selectedYear, 0, 1);
      setAnchorMonth(focus);
      setViewMode("month");
    }
    setEditing(true);
  };

  const togglePeriodDay = (date) => {
    const key = localDateKey(date);
    if (key > today) return;
    setDraftDays((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else {
        for (let offset = 0; offset < periodLength; offset += 1) {
          const fill = shiftDateKey(key, offset);
          if (fill <= today) next.add(fill);
        }
      }
      return next;
    });
  };

  const saveEditedDays = async () => {
    const starts = startsFromDays(draftDays);
    if (!starts.length) {
      setToast("Ядаж нэг сарын тэмдгийн өдрийг сонгоно уу.");
      return;
    }
    setSaving(true);
    const ok = await savePeriodStartDates(starts, periodLength);
    setSaving(false);
    if (ok) {
      setEditing(false);
      setToast("Хадгаллаа");
    }
  };

  const saveCycleSettings = async () => {
    const cycle = Math.min(60, Math.max(15, Number(cycleDraft) || 28));
    const period = Math.min(7, Math.max(2, Number(periodDraft) || 5));
    setSettingsSaving(true);
    const ok = await saveCycle({ lastPeriodStart: periodStarts.at(-1) ?? null, cycleLength: cycle, periodLength: period });
    setSettingsSaving(false);
    if (ok) {
      setPeriodDraft(period);
      setSettingsOpen(false);
      setToast("Мөчлөгийн тохиргоог хадгаллаа");
    }
  };

  const handleDayPress = (date) => {
    const key = localDateKey(date);
    onDayPress?.(new Date(`${key}T00:00:00`));
    setSelectedDate(key);
    setSelectedPending(pendingByDate[key] ?? null);
  };

  const renderDay = (date, miniature = false) => {
    if (!date) return null;
    const key = localDateKey(date);
    const isToday = key === today;
    const isLogged = actualPeriodDays.has(key);
    const isSelected = draftDays.has(key);
    const isPredicted = !editing && predictedPeriodDays.has(key) && !isLogged;
    const isLatePrediction = isPredicted && prediction.late;
    const cycleNumber = hasPeriod ? periodDayNumber(key, activeStarts) : null;
    const periodNumber = isLogged ? periodDayNumber(key, periodStarts) : null;
    const dayDots = dots[key];
    const hasLog = Boolean(dayDots?.size);
    const isOpen = !editing && selectedDate === key;
    const isPending = Boolean(pendingByDate[key]);
    if (miniature) return <span key={key} className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${isLogged ? "bg-[#e0679f] text-white" : isPredicted ? "bg-pink-100 text-[#d95791]" : isLatePrediction ? "bg-slate-100 text-slate-400" : "text-slate-500 dark:text-slate-300"}`}>{date.getDate()}</span>;
    const dateClass = editing
      ? isSelected ? "bg-[#e0679f] text-white" : "border border-slate-300 bg-transparent text-slate-500"
      : isLogged ? "bg-[#e0679f] text-white"
        : isOpen ? "text-[#b83b7e]"
          : isLatePrediction ? "bg-slate-100 text-slate-400"
          : isPredicted ? "bg-pink-100 text-[#d95791]"
            : "text-slate-700 dark:text-slate-200";

    return <button
      key={key}
      type="button"
      disabled={editing && key > today}
      onClick={() => editing ? togglePeriodDay(date) : handleDayPress(date)}
      aria-label={`${dateLabelWithMonth(date)}${isLogged ? `, сарын тэмдгийн ${periodNumber} дахь өдөр` : isPredicted ? ", таамагласан өдөр" : ""}${isToday ? ", өнөөдөр" : ""}${hasLog ? ", тэмдэглэлтэй" : ""}${isPending ? ", баталгаажуулах хүсэлттэй" : ""}`}
      className={`relative mx-auto flex h-[64px] w-full max-w-[48px] flex-col items-center justify-start pt-1 ${editing && key > today ? "cursor-not-allowed opacity-25" : ""}`}
    >
      {!miniature && hasPeriod && (isLogged || isToday) && !editing && <span className={`absolute left-0 top-0 z-10 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-extrabold ${isLogged ? "bg-[#b83b7e] text-white" : "bg-slate-500 text-white"}`}>{isLogged ? periodNumber : cycleNumber}</span>}
      {!miniature && editing && isSelected && <span className="absolute left-0 top-0 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-[#b83b7e] text-white"><Check className="h-3 w-3" /></span>}
      {!miniature && hasPeriod && !editing && !isLogged && !isToday && cycleNumber && <span className="absolute left-0 top-0 text-[9px] font-semibold text-slate-400 dark:text-slate-500">{cycleNumber}</span>}
      <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${dateClass} ${isToday && !editing ? "outline outline-2 outline-dotted outline-[#d95791] outline-offset-1" : ""}`}>
        {date.getDate()}
        {!miniature && isPending && !isLogged && <Clock3 className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-white p-0.5 text-amber-500" />}
      </span>
      {!miniature && <span aria-hidden="true" className="mt-0.5 flex h-2.5 items-center gap-[2px]">
        {dayDots?.has("period") && <span className="text-[8px] leading-none">🩸</span>}
        {CATEGORIES.filter(({ key: category }) => category !== "period" && dayDots?.has(category)).map(({ key: category }) => <span key={category} className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: categoryColor(category) }} />)}
      </span>}
      {!miniature && isToday && <span className="text-[7px] font-black leading-none tracking-wide text-[#b83b7e]">ӨНӨӨДӨР</span>}
    </button>;
  };

  const renderMiniMonth = (date) => {
    const dates = monthDates(date);
    return <button key={monthKey(date)} type="button" onClick={() => openMonth(date)} className="rounded-2xl p-2 text-left transition hover:bg-pink-50 dark:hover:bg-[#392d3e]">
      <span className="mb-1 block text-center text-xs font-black text-slate-700 dark:text-slate-100">{date.getMonth() + 1} сар</span>
      <span className="grid grid-cols-7 gap-y-0.5">{dates.map((day, index) => day ? renderDay(day, true) : <span key={`mini-empty-${monthKey(date)}-${index}`} aria-hidden="true" className="h-7" />)}</span>
    </button>;
  };

  const monthTitle = (date) => `${date.getFullYear() !== currentMonth.getFullYear() ? `${date.getFullYear()} оны ` : ""}${date.getMonth() + 1} сар`;

  return <main ref={mainRef} style={{ backgroundColor: theme === "dark" ? "#211b29" : "#fff7fb", "--calendar-safe-top": "env(safe-area-inset-top)" }} className="fixed inset-0 z-[70] overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-0 text-slate-700 dark:text-slate-100">
    <header style={{ height: "calc(56px + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)" }} className="sticky top-0 z-30 -mx-4 flex box-border items-center justify-between gap-3 bg-white/95 px-4 backdrop-blur dark:bg-[#211b29]/95">
      <button type="button" onClick={onBack} aria-label="Хаах" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-pink-50 dark:text-slate-200 dark:hover:bg-[#392d3e]"><X className="h-5 w-5" /></button>
      <div role="tablist" aria-label="Хуанлийн харагдац" className="grid grid-cols-2 rounded-full bg-pink-50 p-1 dark:bg-[#392d3e]">
        {[{ id: "month", label: "Сар" }, { id: "year", label: "Жил" }].map((item) => <button key={item.id} type="button" role="tab" aria-selected={viewMode === item.id} disabled={editing} onClick={() => setViewMode(item.id)} className={`rounded-full px-5 py-1.5 text-xs font-extrabold disabled:opacity-50 ${viewMode === item.id ? "bg-white text-[#b83b7e] shadow-sm dark:bg-[#514054] dark:text-pink-200" : "text-slate-500 dark:text-slate-300"}`}>{item.label}</button>)}
      </div>
      <button type="button" aria-label="Мөчлөгийн тохиргоо" onClick={() => { setCycleDraft(cycleLengthProp ?? 28); setPeriodDraft(periodLengthProp ?? 5); setSettingsOpen(true); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-pink-50 dark:text-slate-200 dark:hover:bg-[#392d3e]"><Settings2 className="h-5 w-5" /></button>
    </header>

    {viewMode === "month" ? <>
      <div style={{ top: "calc(56px + env(safe-area-inset-top))" }} className="sticky z-20 -mx-4 grid grid-cols-7 bg-white/95 px-4 py-2 text-center text-[11px] font-extrabold text-slate-500 backdrop-blur dark:bg-[#211b29]/95 dark:text-slate-300">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="mx-auto max-w-md">
        {months.map(({ date, key, dates }) => <section key={key} ref={(node) => { monthRefs.current[key] = node; }} className="py-2">
          <h2 className="mb-2 text-center text-base font-black text-slate-700 dark:text-slate-100">{monthTitle(date)}</h2>
          <div className="grid grid-cols-7 gap-y-1">{dates.map((day, index) => day ? renderDay(day) : <span key={`${key}-blank-${index}`} aria-hidden="true" className="h-[54px]" />)}</div>
        </section>)}
      </div>
    </> : <section className="mx-auto max-w-md pb-6">
      <div style={{ top: "calc(56px + env(safe-area-inset-top))" }} className="sticky z-20 flex items-center justify-center gap-6 bg-white/95 py-3 backdrop-blur dark:bg-[#211b29]/95">
        <button type="button" aria-label="Өмнөх жил" onClick={() => setSelectedYear((year) => year - 1)} className="rounded-full p-2 text-slate-500 dark:text-slate-300"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-base font-black text-slate-700 dark:text-slate-100">{selectedYear} он</h2>
        <button type="button" aria-label="Дараагийн жил" onClick={() => setSelectedYear((year) => year + 1)} className="rounded-full p-2 text-slate-500 dark:text-slate-300"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-3 gap-1">{Array.from({ length: 12 }, (_, index) => renderMiniMonth(new Date(selectedYear, index, 1)))}</div>
    </section>}

    <div style={{ background: theme === "dark" ? "linear-gradient(to top, #211b29, rgb(33 27 41 / 95%), transparent)" : "linear-gradient(to top, #fff7fb, rgb(255 247 251 / 95%), transparent)" }} className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-7">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-2">
        {editing ? <>
          <button type="button" onClick={() => setEditing(false)} disabled={saving} className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-extrabold text-slate-600 shadow-md dark:bg-[#392d3e] dark:text-slate-100">Болих</button>
          <button type="button" onClick={saveEditedDays} disabled={saving} className="flex-1 rounded-full bg-[#e0679f] px-4 py-3 text-sm font-extrabold text-white shadow-md disabled:opacity-60">{saving ? "Хадгалж байна…" : "Хадгалах"}</button>
        </> : hasPeriod ? <button type="button" onClick={beginEdit} className="flex items-center justify-center gap-2 rounded-full bg-[#e0679f] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-300/40"><CalendarDays className="h-4 w-4" /> Сарын тэмдгийн өдрүүдийг засах</button> : <button type="button" onClick={startPeriod} className="rounded-full bg-[#e0679f] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-300/40">🩸 Сарын тэмдэг маань ирлээ</button>}
      </div>
    </div>

    {selectedDate && selectedPending ? <DayLogSheet key={selectedDate} date={selectedDate} isPeriodDay={false} pendingPeriod={selectedPending} onClose={() => { setSelectedDate(""); setSelectedPending(null); }} /> : selectedDate && <BottomSheet title={dateLabelWithMonth(new Date(`${selectedDate}T00:00:00`))} onClose={() => setSelectedDate("")}>
      {selectedDate > today ? <p className="rounded-2xl bg-purple-50 p-4 text-sm font-bold text-purple-700 dark:bg-[#392d3e] dark:text-purple-200">Энэ өдөр хараахан болоогүй байна</p> : <div className="space-y-2 pb-2">
        {actualPeriodDays.has(selectedDate) && <p className="rounded-2xl bg-pink-50 p-4 text-sm font-bold text-[#b83b7e] dark:bg-[#392d3e] dark:text-pink-200">Сарын тэмдгийн {periodDayNumber(selectedDate, periodStarts)} дахь өдөр</p>}
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">Өдрийн тэмдэглэлийг энд оруулна.</p>
      </div>}
    </BottomSheet>}

    {settingsOpen && <BottomSheet title="Мөчлөгийн тохиргоо" onClose={() => setSettingsOpen(false)}>
      <div className="space-y-4 pb-2">
        <label className="block text-sm font-bold text-slate-600 dark:text-slate-200">Мөчлөгийн үргэлжлэх хугацаа
          <span className="mt-1 flex items-center gap-2"><input type="number" min={15} max={60} value={cycleDraft} onChange={(event) => setCycleDraft(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 dark:border-slate-600 dark:bg-[#302638] dark:text-white" /><span className="text-xs">хоног</span></span>
        </label>
        <label className="block text-sm font-bold text-slate-600 dark:text-slate-200">Сарын тэмдгийн үргэлжлэх хугацаа
          <span className="mt-1 flex items-center gap-2"><input type="number" min={2} max={7} value={periodDraft} onChange={(event) => setPeriodDraft(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 dark:border-slate-600 dark:bg-[#302638] dark:text-white" /><span className="text-xs">хоног</span></span>
        </label>
        <button type="button" disabled={settingsSaving} onClick={saveCycleSettings} className="w-full rounded-2xl bg-[#e0679f] py-3 text-sm font-extrabold text-white disabled:opacity-60">{settingsSaving ? "Хадгалж байна…" : "Хадгалах"}</button>
      </div>
    </BottomSheet>}
  </main>;
}
