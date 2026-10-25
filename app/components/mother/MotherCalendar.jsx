"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { daysBetween, toDateStr } from "../../../lib/dates";
import { PHASE_COLORS, PHASES } from "../../../lib/data";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SectionTitle from "../ui/SectionTitle";
import CycleRing from "../daughter/CycleRing";

const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function MotherCalendar() {
  const { linked, daughterName, hasCycle, cycleLength, periodLength, lastPeriodStart, noPeriodYet, day, daysLate, phaseKey, daysUntil } = useFamily();
  const [showLargeCalendar, setShowLargeCalendar] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const dates = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    const count = Math.ceil((offset + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
  }, [month]);
  const monthLabel = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long" }).format(month);
  const today = toDateStr();

  const periodDay = (date) => {
    if (!lastPeriodStart || !hasCycle) return false;
    const diff = daysBetween(lastPeriodStart, dateKey(date));
    if (diff < 0) return false;
    return diff % cycleLength < periodLength;
  };

  return (
    <div className="space-y-4">
      <PageHeader sub={`${daughterName || "Охины тань"} · мөчлөг`} title="Сарын тэмдгийн календарь 🗓️" />
      {!linked ? (
        <Card><p className="py-4 text-center text-sm font-semibold text-slate-500">Охиноо холбосны дараа календарийг харах боломжтой 🌱</p></Card>
      ) : noPeriodYet ? (
        <Card><SectionTitle icon={CalendarDays} title="Календарь" /><p className="text-sm font-semibold text-slate-500">Одоогоор сарын тэмдгийн эхэлсэн өдөр бүртгэгдээгүй байна. 🌱</p></Card>
      ) : !hasCycle ? (
        <Card><SectionTitle icon={CalendarDays} title="Календарь" /><p className="text-sm font-semibold text-slate-500">Охины мөчлөгийн мэдээлэл ороогүй байна.</p></Card>
      ) : (
        <>
          <Card className="!mt-0 min-h-[740px] pb-12">
            <SectionTitle
              icon={Droplets}
              title="Охины мөчлөг"
              right={
                <button type="button" onClick={() => setShowLargeCalendar(true)} className="flex items-center gap-1 rounded-full bb-bg-FDE7F1 bb-text-B83B7E px-2.5 py-1.5 text-xs font-extrabold active:scale-95">
                  <CalendarDays className="h-3.5 w-3.5" /> Хуанли
                </button>
              }
            />
            <div className="mx-auto w-fit">
              <button type="button" onClick={() => setShowLargeCalendar(true)} aria-label="Охины мөчлөгийн хуанли нээх" className="block rounded-full p-0 active:scale-[0.98] transition-transform">
                <CycleRing day={day} cycleLength={cycleLength} periodLength={periodLength} phaseKey={phaseKey} daysUntil={daysUntil} daysLate={daysLate} />
              </button>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
              {Object.entries(PHASE_COLORS).map(([key, color]) => (
                <span key={key} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{PHASES[key].short}</span>
              ))}
            </div>
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">Өмнөх тэмдэглэсэн өдрөөр тооцоолсон тул мөчлөгийн өдөр зөрж магадгүй.</p>
          </Card>

          {showLargeCalendar && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Сарын хуанли" onClick={() => setShowLargeCalendar(false)}>
              <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-black text-slate-700">Охины сарын хуанли</h2>
                  <button type="button" onClick={() => setShowLargeCalendar(false)} className="flex h-9 w-9 items-center justify-center rounded-full bb-bg-FFF7FB text-slate-600" aria-label="Хаах"><X className="h-5 w-5" /></button>
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" aria-label="Өмнөх сар" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bb-bg-FFF7FB text-slate-600"><ChevronLeft className="h-5 w-5" /></button>
                  <p className="font-extrabold capitalize text-slate-700">{monthLabel}</p>
                  <button type="button" aria-label="Дараагийн сар" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bb-bg-FFF7FB text-slate-600"><ChevronRight className="h-5 w-5" /></button>
                </div>
                <div className="mt-4 grid grid-cols-7 text-center text-xs font-extrabold text-slate-400">{WEEKDAYS.map((weekday) => <span key={weekday} className="py-2">{weekday}</span>)}</div>
                <div className="grid grid-cols-7 gap-y-2 text-center">
                  {dates.map((date) => {
                    const key = dateKey(date);
                    const isCurrentMonth = date.getMonth() === month.getMonth();
                    const isPeriod = periodDay(date);
                    const isToday = key === today;
                    return <div key={key} className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${isPeriod ? "bb-bg-FDE7F1 bb-text-B83B7E" : isCurrentMonth ? "text-slate-700" : "text-slate-300"} ${isToday ? "ring-2 ring-purple-300" : ""}`}>{date.getDate()}</div>;
                  })}
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-500"><span className="h-3 w-3 rounded-full bb-bg-FDE7F1 border bb-border-F48FB1" />Сарын тэмдэг ирсэн эсвэл тооцоолсон өдөр</div>
                <p className="mt-3 text-xs font-semibold text-slate-400">Өмнөх тэмдэглэсэн өдрөөр тооцоолсон тул дараагийн өдрүүд зөрж магадгүй.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
