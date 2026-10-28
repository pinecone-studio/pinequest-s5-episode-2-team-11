"use client";

import { useState } from "react";
import { CalendarHeart, Minus, Plus, Loader2 } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { toDateStr, addDays } from "../../../lib/dates";

function Stepper({ id, label, hint, value, setValue, min, max }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
      >
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setValue(Math.max(min, value - 1))}
          className="w-12 h-12 rounded-2xl bg-[#30283a] border-2 border-[#594963] text-[#d8b8ff] flex items-center justify-center transition hover:border-[#d88ab8] active:scale-90"
          aria-label="Хасах"
        >
          <Minus className="w-5 h-5" />
        </button>
        <output id={id} className="flex-1 text-center text-3xl font-black text-slate-700">
          {value} <span className="text-base font-bold text-slate-400">хоног</span>
        </output>
        <button
          type="button"
          onClick={() => setValue(Math.min(max, value + 1))}
          className="w-12 h-12 rounded-2xl bg-[#30283a] border-2 border-[#594963] text-[#d8b8ff] flex items-center justify-center transition hover:border-[#d88ab8] active:scale-90"
          aria-label="Нэмэх"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs font-semibold text-slate-400">{hint}</p>}
    </div>
  );
}

/**
 * Мөчлөгийн мэдээлэл оруулах. Анх бүртгүүлэхэд болон «Би» хэсгээс засахад ашиглана.
 * onDone байвал (тохиргооноос нээсэн үед) хадгалсны дараа дуудна.
 */
export default function CycleSetup({ onDone }) {
  const { saveCycle, markNoPeriodYet, lastPeriodStart, cycleLength, periodLength } = useFamily();
  const today = toDateStr();
  const [start, setStart] = useState(lastPeriodStart ?? today);
  const [cl, setCl] = useState(cycleLength);
  const [pl, setPl] = useState(periodLength);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await saveCycle({ lastPeriodStart: start, cycleLength: cl, periodLength: pl });
    setBusy(false);
    if (ok && onDone) onDone();
  };

  return (
    <div className="px-2 pt-4 pb-10 bloom-fade space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-700">Мөчлөгөө тохируулъя</h2>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f7d7e8] to-[#ded0ff] shadow-md shadow-[#d88ab8]/20 ring-1 ring-white/20">
          <CalendarHeart className="h-6 w-6 text-[#8d579e]" />
        </div>
      </div>

      <div>
        <label
          htmlFor="last-period"
          className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2"
        >
          Сүүлийн сарын тэмдэг хэзээ эхэлсэн бэ?
        </label>
        <input
          id="last-period"
          type="date"
          value={start}
          max={today}
          min={addDays(today, -90)}
          onChange={(e) => e.target.value && setStart(e.target.value)}
          className="w-full rounded-2xl border-2 border-[#594963] bb-focus-border-F48FB1 outline-none px-4 py-3 font-bold text-slate-700 bg-white shadow-sm shadow-black/10"
        />
      </div>

      <Stepper
        id="cycle-length"
        label="Мөчлөг ойролцоогоор хэдэн хоног вэ?"
        hint="Өсвөр насанд 21–45 хоног хэвийн. Мэдэхгүй бол 28 хэвээр нь үлдээгээрэй."
        value={cl}
        setValue={setCl}
        min={15}
        max={60}
      />
      <Stepper
        id="period-length"
        label="Сарын тэмдэг хэдэн хоног үргэлжилдэг вэ?"
        hint="Ихэвчлэн 3–7 хоног."
        value={pl}
        setValue={setPl}
        min={1}
        max={14}
      />

      <button
        onClick={save}
        disabled={busy}
        className="w-full bb-bg-E0679F text-white font-extrabold rounded-2xl py-4 active:scale-95 transition shadow-lg bb-shadow-F48FB1-30 flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-5 h-5 animate-spin" />}
        Хадгалах
      </button>

      {!onDone && (
        <button
          onClick={markNoPeriodYet}
          className="w-full rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E font-extrabold py-4 active:scale-95 transition"
        >
          🌱 Анхны сарын тэмдэг маань хараахан ирээгүй
        </button>
      )}
    </div>
  );
}
