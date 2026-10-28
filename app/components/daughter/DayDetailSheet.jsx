"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Lock, Moon, Sun } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { addDaysToLocalDateKey, getCyclePosition, localDateKey } from "../../../lib/cycle";
import {
  CATEGORIES, CATEGORY_BY_KEY, LOG_ENTRIES_CHANGED, SLEEP_QUALITY, categoryColor, fetchEntries, latestOf, splitByTime, summarizeEntry,
} from "../../../lib/log-entries";
import { supabase } from "../../../lib/supabase";
import BottomSheet from "../ui/BottomSheet";
import CategoryLogSheet from "./CategoryLogSheet";
import PrivateNoteSheet from "./PrivateNoteSheet";
import { monthDay, t } from "../../../lib/i18n";

const VISIBLE_PER_COLUMN = 3;

const dayTitle = (date, today) => {
  if (date === today) return t("Өнөөдөр", "Today");
  const [year, month, day] = date.split("-").map(Number);
  return monthDay(month, day, year !== Number(today.slice(0, 4)) ? year : undefined);
};

const periodStartOf = (period) => (typeof period === "string" ? period : period.startDate ?? period.log_date);

function EntryCard({ entry, onOpen }) {
  const meta = CATEGORY_BY_KEY[entry.category];
  const summary = summarizeEntry(entry);
  return (
    <button type="button" onClick={() => onOpen(entry)} aria-label={t(`${meta.label}: ${summary}. Засах`, `${meta.label}: ${summary}. Edit`)} className="flex w-full min-w-0 items-center gap-2 rounded-2xl bg-white p-2 text-left shadow-sm">
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base" style={{ backgroundColor: categoryColor(entry.category) }}>{meta.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-extrabold text-slate-700">{meta.label}</span>
        <span className="block truncate text-[11px] font-semibold text-slate-500">{summary}</span>
      </span>
    </button>
  );
}

function TimelineColumn({ label, icon: Icon, entries, onOpen }) {
  const [showAll, setShowAll] = useState(false);
  const hidden = entries.length - VISIBLE_PER_COLUMN;
  const visible = showAll ? entries : entries.slice(0, VISIBLE_PER_COLUMN);
  return (
    <section className="min-w-0 space-y-2">
      <h4 className="flex items-center gap-1 text-xs font-extrabold text-slate-500"><Icon className="h-3.5 w-3.5" /> {label}</h4>
      {visible.map((entry) => <EntryCard key={entry.id} entry={entry} onOpen={onOpen} />)}
      {!showAll && hidden > 0 && (
        <button type="button" onClick={() => setShowAll(true)} aria-label={t(`Бусад ${hidden} бүртгэлийг харах`, `Show ${hidden} more entries`)} className="flex h-8 min-w-8 items-center justify-center rounded-full bb-bg-FDE7F1 px-2 text-xs font-black bb-text-B83B7E">+{hidden}</button>
      )}
    </section>
  );
}

/**
 * Day detail (calendar tap and the Today page): 5 category circles, AM/PM
 * timeline in Ulaanbaatar time, sleep, and the locked private-note row.
 * Note text is never loaded here.
 */
export default function DayDetailSheet({ date, pendingPeriod = null, onClose }) {
  const { profile, cyclePeriods, cycleLength, respondPeriodEntry } = useFamily();
  const today = localDateKey(new Date());
  const future = date > today;
  const [entries, setEntries] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [logging, setLogging] = useState(null); // { category, entry? }
  const [noteOpen, setNoteOpen] = useState(false);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (future || !supabase || !profile?.id) { setEntries([]); return undefined; }
    let cancelled = false;
    const load = () => fetchEntries(supabase, date, date).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[log_entries] day:", error.message);
      setLoadError(Boolean(error));
      setEntries(data);
    });
    load();
    window.addEventListener(LOG_ENTRIES_CHANGED, load);
    return () => { cancelled = true; window.removeEventListener(LOG_ENTRIES_CHANGED, load); };
  }, [date, future, profile?.id]);

  const position = useMemo(() => getCyclePosition(date, cyclePeriods ?? [], { cycleLength }), [date, cyclePeriods, cycleLength]);
  const isPeriodDay = useMemo(() => (cyclePeriods ?? []).some((period) => {
    const start = periodStartOf(period);
    const length = typeof period === "string" ? 5 : period.duration ?? 5;
    return start && start <= date && date <= addDaysToLocalDateKey(start, length - 1);
  }), [cyclePeriods, date]);

  const logged = useMemo(() => new Set((entries ?? []).map((entry) => entry.category)), [entries]);
  const { morning, evening } = useMemo(() => splitByTime(entries ?? []), [entries]);
  const sleep = useMemo(() => latestOf(entries ?? [], "sleep"), [entries]);
  const sleepQuality = sleep && SLEEP_QUALITY.find(([key]) => key === sleep.value.quality);

  const decidePeriod = async (approve) => {
    if (!pendingPeriod || responding) return;
    setResponding(true);
    const ok = await respondPeriodEntry(pendingPeriod.id, approve);
    setResponding(false);
    if (ok) onClose();
  };

  const aside = position.phase === "cycle" && position.cycleDay >= 1
    ? <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{t("МӨЧЛӨГИЙН", "CYCLE DAY")} {position.cycleDay} {t("ДЭХ ӨДӨР", "")}</span>
    : null;

  return (
    <>
      <BottomSheet title={dayTitle(date, today)} aside={aside} onClose={onClose} draggable>
        <div className="space-y-5 pb-4">
          {pendingPeriod && !future && <section className="rounded-2xl bb-bg-FDE7F1-50 p-3">
            <p className="text-sm font-bold leading-relaxed text-slate-600">{t("Асран хамгаалагч энэ өдрийг сарын тэмдэг эхэлсэн гэж санал болгосон. Баталгаажуулах уу?", "Your guardian suggested your period started on this day. Confirm?")}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" disabled={responding} onClick={() => decidePeriod(false)} className="rounded-xl bg-white py-2.5 text-xs font-extrabold text-slate-500 disabled:opacity-60">{t("Үгүй", "No")}</button>
              <button type="button" disabled={responding} onClick={() => decidePeriod(true)} className="rounded-xl bb-bg-E0679F py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{responding ? t("Хадгалж байна…", "Saving…") : t("Баталгаажуулах", "Confirm")}</button>
            </div>
          </section>}

          <section>
            <div className="grid grid-cols-5 gap-1">
              {CATEGORIES.map(({ key, emoji, label }) => {
                const filled = logged.has(key);
                return (
                  <button key={key} type="button" disabled={future || entries == null} onClick={() => setLogging({ category: key })}
                    aria-label={`${label}${filled ? t(", тэмдэглэсэн", ", logged") : ""}`} className="flex min-w-0 flex-col items-center gap-1 disabled:opacity-40">
                    <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full text-2xl transition"
                      style={filled ? { backgroundColor: categoryColor(key) } : { border: `3px solid ${categoryColor(key)}` }}>{emoji}</span>
                    <span className="w-full text-center text-[10px] font-extrabold leading-tight text-slate-600">{label}</span>
                  </button>
                );
              })}
            </div>
            {future && <p className="mt-3 rounded-2xl bb-bg-E9DDFC-50 p-3 text-center text-sm font-bold bb-text-7C4DCC">{t("Энэ өдөр хараахан болоогүй байна", "This day hasn't happened yet")}</p>}
            {loadError && <p role="alert" className="mt-3 text-xs font-bold text-rose-600">{t("Бүртгэл ачаалж чадсангүй. Supabase-ийн log-entries migration-ийг шалгана уу.", "Couldn't load entries. Check the Supabase log-entries migration.")}</p>}
          </section>

          {!future && <section>
            {entries == null ? (
              <p className="py-4 text-center text-sm font-bold text-slate-400">{t("Ачаалж байна…", "Loading…")}</p>
            ) : entries.length ? (
              <div className="grid grid-cols-2 gap-2">
                <TimelineColumn label={t("Өглөө", "Morning")} icon={Sun} entries={morning} onOpen={(entry) => setLogging({ category: entry.category, entry })} />
                <TimelineColumn label={t("Орой", "Evening")} icon={Moon} entries={evening} onOpen={(entry) => setLogging({ category: entry.category, entry })} />
              </div>
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center text-sm font-bold text-slate-400">{t("Энд тэмдэглэл харагдана", "Your logs will show here")}</p>
            )}
          </section>}

          <section className="rounded-2xl bg-white p-3 shadow-sm">
            <h3 className="text-sm font-black text-slate-700">{t("Миний нойр", "My sleep")}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-400"><Moon className="h-3 w-3" /> {t("Нойр өмнөх шөнөөс бүртгэгдэнэ", "Sleep is logged for the previous night")}</p>
            {sleep ? (
              <button type="button" disabled={future} onClick={() => setLogging({ category: "sleep", entry: sleep })} className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left" style={{ backgroundColor: categoryColor("sleep") }}>
                <span className="text-sm font-black text-slate-800">{sleep.value.hours} {t("цаг унтсан", "h of sleep")}</span>
                <span className="text-xl" aria-label={sleepQuality?.[1]}>{sleepQuality?.[2]}</span>
              </button>
            ) : (
              <p className="mt-2 text-sm font-semibold text-slate-400">{t("Тэмдэглэсэн нойр энд харагдана", "Logged sleep will show here")}</p>
            )}
          </section>

          <button type="button" disabled={future} onClick={() => setNoteOpen(true)} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-left text-sm font-extrabold text-slate-600 disabled:opacity-40">
            <span className="flex items-center gap-2"><Lock className="h-4 w-4 bb-text-7C4DCC" /> {t("🔒 Нууц тэмдэглэл", "🔒 Private note")}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </BottomSheet>

      {logging && <CategoryLogSheet key={`${logging.category}:${logging.entry?.id ?? "new"}`} date={date} category={logging.category} entry={logging.entry ?? null} isPeriodDay={isPeriodDay} onClose={() => setLogging(null)} />}
      {noteOpen && <PrivateNoteSheet date={date} onClose={() => setNoteOpen(false)} />}
    </>
  );
}
