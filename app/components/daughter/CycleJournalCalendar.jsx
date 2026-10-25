"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import SectionTitle from "../ui/SectionTitle";

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CycleJournalCalendar({ lastPeriodStart, cycleLength = 28, periodLength = 5, showTitle = true }) {
  const { saveCycle, startPeriod, setToast } = useFamily();
  const [notes, setNotes] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(new Date()));
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const prefix = "bloom:private-note:";
    const entries = Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .reduce((result, key) => {
        const value = window.localStorage.getItem(key);
        if (value) result[key.slice(prefix.length)] = value;
        return result;
      }, {});

    Object.keys(window.localStorage).filter((key) => key.startsWith("bloom:checkin:")).forEach((key) => {
      const date = key.slice("bloom:checkin:".length);
      try {
        const checkin = JSON.parse(window.localStorage.getItem(key));
        if (checkin?.reason && !entries[date]) {
          entries[date] = `Яагаад ингэж мэдэрсэн бэ?\n${checkin.reason}`;
          window.localStorage.setItem(`${prefix}${date}`, entries[date]);
        }
        if (checkin?.reason) {
          delete checkin.reason;
          window.localStorage.setItem(key, JSON.stringify(checkin));
        }
      } catch {
        // Хуучин тэмдэглэл уншигдахгүй бол алгасна.
      }
    });

    setNotes(entries);
    setDraft(entries[localDateKey(new Date())] ?? "");
    setLoaded(true);
  }, []);

  const offset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
  const dates = Array.from({ length: cellCount }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i - offset + 1));
  const monthLabel = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long" }).format(month);
  const start = lastPeriodStart ? new Date(`${lastPeriodStart}T00:00:00`) : null;
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`);
  const todayKey = localDateKey(new Date());
  const selectedNotFuture = selectedDate <= todayKey;
  const daysFromStart = start ? Math.round((selectedDateObject - start) / 86400000) : -1;

  const isPeriodDate = (date) => {
    if (!start || !cycleLength || !periodLength) return false;
    const difference = Math.floor((date - start) / 86400000);
    const cycleDay = ((difference % cycleLength) + cycleLength) % cycleLength;
    return cycleDay < periodLength;
  };

  const save = () => {
    const key = `bloom:private-note:${selectedDate}`;
    const text = draft.trim();
    const next = { ...notes };
    if (text) {
      next[selectedDate] = text;
      window.localStorage.setItem(key, text);
    } else {
      delete next[selectedDate];
      window.localStorage.removeItem(key);
    }
    setNotes(next);
  };

  const correctStartDate = async () => {
    const ok = selectedDate === todayKey
      ? await startPeriod()
      : await saveCycle({ lastPeriodStart: selectedDate, cycleLength, periodLength });
    if (ok && selectedDate !== todayKey) setToast("Мөчлөгийн эхэлсэн өдрийг шинэчиллээ.");
  };

  const correctEndDate = async () => {
    const nextPeriodLength = daysFromStart + 1;
    const ok = await saveCycle({ lastPeriodStart, cycleLength, periodLength: nextPeriodLength });
    if (ok) setToast("Сарын тэмдэг дууссан өдрийг шинэчиллээ.");
  };

  return (
    <div>
      {showTitle && <SectionTitle icon={Pencil} title="Миний өдрийн тэмдэглэл" />}
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Өмнөх сар" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-extrabold capitalize text-slate-700">{monthLabel}</p>
        <button type="button" aria-label="Дараагийн сар" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-extrabold text-slate-400">
        {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((day) => <span key={day} className="py-2">{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {dates.map((date) => {
          const key = localDateKey(date);
          const inMonth = date.getMonth() === month.getMonth();
          const selected = key === selectedDate;
          const hasNote = Boolean(notes[key]);
          const today = key === localDateKey(new Date());
          const periodDay = isPeriodDate(date);
          return (
            <button key={key} type="button" onClick={() => {
              setSelectedDate(key);
              setDraft(notes[key] ?? "");
              if (!inMonth) setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
              aria-label={`${key}${periodDay ? ", сарын тэмдгийн өдөр" : ""}${hasNote ? ", тэмдэглэлтэй" : ""}`}
              className={`relative mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-sm font-bold ${
                selected ? "bb-bg-FDE7F1 bb-text-B83B7E" : periodDay ? "bb-bg-FDE7F1 text-slate-700" : inMonth ? "text-slate-700 hover:bg-slate-50" : "text-slate-300"
              } ${today && !selected ? "ring-1 ring-purple-300" : ""}`}>
              <span>{date.getDate()}</span>
              {hasNote && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-pink-600" : "bg-purple-400"}`} />}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bb-bg-FDE7F1" /> Тооцоолсон сарын тэмдгийн өдрүүд</span>
        <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Тэмдэглэлтэй өдөр</span>
      </div>
      <p className="mt-3 text-xs font-bold text-slate-500">{selectedDate}</p>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4}
        placeholder="Өнөөдөр юу болсон, юу мэдэрч байгаагаа бичээрэй…"
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400" />
      <button type="button" disabled={!loaded} onClick={save}
        className="mt-2 w-full rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-50">
        Тэмдэглэлээ хадгалах
      </button>
      {selectedNotFuture && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <p className="text-xs font-extrabold text-slate-500">Мөчлөгийн огноог засах</p>
          {selectedDate !== lastPeriodStart && (
            <button type="button" onClick={correctStartDate}
              className="w-full rounded-2xl bb-bg-FDE7F1 py-3 text-sm font-extrabold bb-text-B83B7E">
              Энэ өдөр сарын тэмдэг эхэлсэн
            </button>
          )}
          {start && daysFromStart >= 0 && daysFromStart < 14 && daysFromStart + 1 !== periodLength && (
            <button type="button" onClick={correctEndDate}
              className="w-full rounded-2xl bb-bg-E9DDFC-50 py-3 text-sm font-extrabold bb-text-7C4DCC">
              Энэ өдрийг дууссан өдөр болгох
            </button>
          )}
        </div>
      )}
    </div>
  );
}
