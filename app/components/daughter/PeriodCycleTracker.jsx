"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Check, Clock3, Settings2, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
import { addDaysToLocalDateKey, localDateKey, dateLabelMongolian } from "../../../lib/cycle";
import { toggleSelectedPeriodDay } from "../../../lib/period-edit";
import { supabase } from "../../../lib/supabase";
import BottomSheet from "../ui/BottomSheet";
import DayDetailSheet from "./DayDetailSheet";
import DayLogSheet from "./DayLogSheet";

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

function periodDayNumber(dateKey, starts) {
  const start = [...starts].filter((item) => item <= dateKey).sort().at(-1);
  return start ? Math.round((new Date(`${dateKey}T00:00:00`) - new Date(`${start}T00:00:00`)) / DAY_MS) + 1 : null;
}

function cycleDayNumber(dateKey, starts, length) {
  const elapsed = periodDayNumber(dateKey, starts);
  if (!elapsed || !Number.isFinite(length) || length < 1) return elapsed;
  return ((elapsed - 1) % length) + 1;
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
    profile, periodStarts, periodLogs, cyclePeriods, periodPrediction: prediction, noPeriodYet, savePeriodDays,
    saveCycle, setToast,
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
  const savingRef = useRef(false);
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
  const activeStarts = periodStarts;
  const hasPeriod = !noPeriodYet && activeStarts.length > 0;
  const periodLength = Number(periodDraft || periodLengthProp || 5);
  const actualPeriodDays = useMemo(() => {
    if (editing) return new Set(draftDays);
    if (!hasPeriod) return new Set();
    const days = new Set();
    for (const period of cyclePeriods) {
      const start = typeof period === "string" ? period : period.startDate;
      const length = typeof period === "string" || period.duration == null ? periodLength : period.duration;
      for (let offset = 0; offset < length; offset += 1) {
        const date = addDaysToLocalDateKey(start, offset);
        if (date <= today) days.add(date);
      }
    }
    return days;
  }, [editing, draftDays, hasPeriod, cyclePeriods, periodLength, today]);
  // Same prediction object as the Today ring (FamilyContext.periodPrediction).
  const predictedPeriodDays = useMemo(() => new Set(hasPeriod ? prediction.predictedDays : []), [hasPeriod, prediction.predictedDays]);
  const overduePeriodDays = useMemo(() => new Set(hasPeriod ? prediction.overdueDays : []), [hasPeriod, prediction.overdueDays]);
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
    setDraftDays((current) => toggleSelectedPeriodDay(current, key));
  };

  const saveEditedDays = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      // On failure savePeriodDays logs + toasts and we stay in edit mode with draftDays intact.
      if (await savePeriodDays([...draftDays])) {
        setEditing(false);
        setToast("Хадгаллаа");
      }
    } catch (error) {
      console.error("[period_logs] save threw:", error);
      setToast("Хадгалж чадсангүй. Дахин оролдоно уу.");
    } finally {
      savingRef.current = false;
      setSaving(false);
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
    const isLatePrediction = !editing && overduePeriodDays.has(key) && !isLogged;
    const cycleNumber = hasPeriod ? cycleDayNumber(key, activeStarts, Number(cycleLengthProp ?? 28)) : null;
    const periodNumber = isLogged ? periodDayNumber(key, periodStarts) : null;
    const dayDots = dots[key];
    const hasLog = Boolean(dayDots?.size);
    const isOpen = !editing && selectedDate === key;
    const isPending = Boolean(pendingByDate[key]);
    if (miniature) return <span key={key} style={theme === "dark" && isPredicted ? { backgroundColor: "#422a3c", color: "#f2a5c9" } : undefined} className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${isLogged ? "bg-[#e0679f] text-white" : isPredicted ? "bg-pink-100 text-[#d95791]" : isLatePrediction ? "bg-slate-100 text-slate-400" : "text-slate-500"}`}>{date.getDate()}</span>;
    const dateClass = editing
      ? isSelected ? "bg-[#e0679f] text-white" : "border border-slate-300 bg-transparent text-slate-500"
      : isLogged ? "bg-[#e0679f] text-white"
        : isOpen ? "text-[#b83b7e]"
          : isLatePrediction ? "bg-slate-100 text-slate-400"
          : isPredicted ? "bg-pink-100 text-[#d95791]"
            : "text-slate-700";
    const dateStyle = theme === "dark"
      ? isLatePrediction ? { backgroundColor: "#3a3242", color: "#a99aaf" }
        : isPredicted ? { backgroundColor: "#422a3c", color: "#f2a5c9" }
          : undefined
      : undefined;

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
      {!miniature && hasPeriod && !editing && !isLogged && !isToday && cycleNumber && <span className="absolute left-0 top-0 text-[9px] font-semibold text-slate-400">{cycleNumber}</span>}
      <span style={dateStyle} className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${dateClass} ${isToday && !editing ? "outline outline-2 outline-dotted outline-[#d95791] outline-offset-1" : ""}`}>
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
    return <button key={monthKey(date)} type="button" onClick={() => openMonth(date)} className="rounded-2xl p-2 text-left text-slate-700 transition hover:bg-pink-50">
      <span className="mb-1 block text-center text-xs font-black text-slate-700">{date.getMonth() + 1} сар</span>
      <span className="grid grid-cols-7 gap-y-0.5">{dates.map((day, index) => day ? renderDay(day, true) : <span key={`mini-empty-${monthKey(date)}-${index}`} aria-hidden="true" className="h-7" />)}</span>
    </button>;
  };

  const monthTitle = (date) => `${date.getFullYear() !== currentMonth.getFullYear() ? `${date.getFullYear()} оны ` : ""}${date.getMonth() + 1} сар`;

  return <>
    <div aria-hidden="true" className="fixed inset-0 z-[69]" style={{ backgroundColor: theme === "dark" ? "#211b29" : "#fff7fb" }} />
    <main ref={mainRef} style={{ backgroundColor: theme === "dark" ? "#211b29" : "#fff7fb", "--calendar-safe-top": "env(safe-area-inset-top)" }} className="fixed inset-y-0 left-0 right-0 z-[70] mx-auto w-full max-w-md overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-0 text-slate-700">
    <header style={{ height: "calc(56px + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)" }} className="sticky top-0 z-30 -mx-4 flex box-border items-center justify-between gap-3 bg-white/95 px-4 backdrop-blur">
      <button type="button" onClick={onBack} aria-label="Хаах" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-pink-50"><X className="h-5 w-5" /></button>
      <div role="tablist" aria-label="Хуанлийн харагдац" style={theme === "dark" ? { backgroundColor: "#392d3e" } : undefined} className="grid grid-cols-2 rounded-full bg-pink-50 p-1">
        {[{ id: "month", label: "Сар" }, { id: "year", label: "Жил" }].map((item) => <button key={item.id} type="button" role="tab" aria-selected={viewMode === item.id} disabled={editing} onClick={() => setViewMode(item.id)} style={theme === "dark" && viewMode === item.id ? { backgroundColor: "#514054", color: "#f2a5c9" } : undefined} className={`rounded-full px-5 py-1.5 text-xs font-extrabold disabled:opacity-50 ${viewMode === item.id ? "bg-white text-[#b83b7e] shadow-sm" : "text-slate-500"}`}>{item.label}</button>)}
      </div>
      <button type="button" aria-label="Мөчлөгийн тохиргоо" onClick={() => { setCycleDraft(cycleLengthProp ?? 28); setPeriodDraft(periodLengthProp ?? 5); setSettingsOpen(true); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-pink-50"><Settings2 className="h-5 w-5" /></button>
    </header>

    {viewMode === "month" ? <>
      <div style={{ top: "calc(56px + env(safe-area-inset-top))" }} className="sticky z-20 -mx-4 grid grid-cols-7 bg-white/95 px-4 py-2 text-center text-[11px] font-extrabold text-slate-500 backdrop-blur">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="mx-auto max-w-md">
        {months.map(({ date, key, dates }) => <section key={key} ref={(node) => { monthRefs.current[key] = node; }} className="py-2">
          <h2 className="mb-2 text-center text-base font-black text-slate-700">{monthTitle(date)}</h2>
          <div className="grid grid-cols-7 gap-y-1">{dates.map((day, index) => day ? renderDay(day) : <span key={`${key}-blank-${index}`} aria-hidden="true" className="h-[54px]" />)}</div>
        </section>)}
      </div>
    </> : <section className="mx-auto max-w-md pb-6">
      <div style={{ top: "calc(56px + env(safe-area-inset-top))" }} className="sticky z-20 flex items-center justify-center gap-6 bg-white/95 py-3 backdrop-blur">
        <button type="button" aria-label="Өмнөх жил" onClick={() => setSelectedYear((year) => year - 1)} className="rounded-full p-2 text-slate-500"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-base font-black text-slate-700">{selectedYear} он</h2>
        <button type="button" aria-label="Дараагийн жил" onClick={() => setSelectedYear((year) => year + 1)} className="rounded-full p-2 text-slate-500"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-3 gap-1">{Array.from({ length: 12 }, (_, index) => renderMiniMonth(new Date(selectedYear, index, 1)))}</div>
    </section>}

    <div style={{ background: theme === "dark" ? "linear-gradient(to top, #211b29, rgb(33 27 41 / 95%), transparent)" : "linear-gradient(to top, #fff7fb, rgb(255 247 251 / 95%), transparent)" }} className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-7">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-2">
        {editing ? <>
          <button type="button" onClick={() => setEditing(false)} disabled={saving} className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-extrabold text-slate-600 shadow-md">Болих</button>
          <button type="button" onClick={saveEditedDays} disabled={saving} className="flex-1 rounded-full bg-[#e0679f] px-4 py-3 text-sm font-extrabold text-white shadow-md disabled:opacity-60">{saving ? "Хадгалж байна…" : "Хадгалах"}</button>
        </> : <button type="button" onClick={beginEdit} className="flex items-center justify-center gap-2 rounded-full bg-[#e0679f] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-pink-300/40"><CalendarDays className="h-4 w-4" /> Сарын тэмдгийн өдрүүдийг засах</button>}
      </div>
    </div>

    {selectedDate && selectedPending ? <DayLogSheet key={selectedDate} date={selectedDate} isPeriodDay={false} pendingPeriod={selectedPending} onClose={() => { setSelectedDate(""); setSelectedPending(null); }} /> : selectedDate && <BottomSheet title={dateLabelWithMonth(new Date(`${selectedDate}T00:00:00`))} onClose={() => setSelectedDate("")}>
      {selectedDate > today ? <p style={theme === "dark" ? { backgroundColor: "#392d3e", color: "#e8b8d0" } : undefined} className="rounded-2xl bg-purple-50 p-4 text-sm font-bold text-purple-700">Энэ өдөр хараахан болоогүй байна</p> : <div className="space-y-2 pb-2">
        {actualPeriodDays.has(selectedDate) && <p style={theme === "dark" ? { backgroundColor: "#392d3e", color: "#f2a5c9" } : undefined} className="rounded-2xl bg-pink-50 p-4 text-sm font-bold text-[#b83b7e]">Сарын тэмдгийн {periodDayNumber(selectedDate, periodStarts)} дахь өдөр</p>}
        <p className="text-sm font-semibold text-slate-500">Өдрийн тэмдэглэлийг энд оруулна.</p>
      </div>}
    </BottomSheet>}

    {settingsOpen && <BottomSheet title="Мөчлөгийн тохиргоо" onClose={() => setSettingsOpen(false)}>
      <div className="space-y-4 pb-2">
        <label className="block text-sm font-bold text-slate-600">Мөчлөгийн үргэлжлэх хугацаа
          <span className="mt-1 flex items-center gap-2"><input type="number" min={15} max={60} value={cycleDraft} onChange={(event) => setCycleDraft(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700" /><span className="text-xs">хоног</span></span>
        </label>
        <label className="block text-sm font-bold text-slate-600">Сарын тэмдгийн үргэлжлэх хугацаа
          <span className="mt-1 flex items-center gap-2"><input type="number" min={2} max={7} value={periodDraft} onChange={(event) => setPeriodDraft(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700" /><span className="text-xs">хоног</span></span>
        </label>
        <button type="button" disabled={settingsSaving} onClick={saveCycleSettings} className="w-full rounded-2xl bg-[#e0679f] py-3 text-sm font-extrabold text-white disabled:opacity-60">{settingsSaving ? "Хадгалж байна…" : "Хадгалах"}</button>
      </div>
    </BottomSheet>}
    </main>
  </>;
}