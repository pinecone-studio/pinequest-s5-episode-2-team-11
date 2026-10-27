"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { localDateKey } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";
import Card from "../ui/Card";
import DayLogSheet from "./DayLogSheet";

const MOODS = [{ value: 5, emoji: "😄" }, { value: 4, emoji: "🙂" }, { value: 3, emoji: "😐" }, { value: 2, emoji: "😟" }, { value: 1, emoji: "😣" }];

export default function TodayMoodCard({ periodDay = false }) {
  const { profile } = useFamily();
  const date = localDateKey(new Date());
  const [mood, setMood] = useState(null);
  const [hasLog, setHasLog] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!profile?.id || !supabase) return () => { cancelled = true; };
    supabase.rpc("get_my_day_logs", { p_from: date, p_to: date }).then(({ data, error }) => {
      if (cancelled || error) return;
      const row = data?.[0];
      setMood(row?.mood ?? null);
      setHasLog(Boolean(row));
    });
    return () => { cancelled = true; };
  }, [date, profile?.id]);

  return (
    <>
      <Card className="!p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-700">Өнөөдөр ямар байна?</h2>
          {hasLog && <button type="button" onClick={() => setOpen(true)} className="text-xs font-extrabold bb-text-B83B7E">Засах</button>}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {MOODS.map(({ value, emoji }) => (
            <button key={value} type="button" onClick={() => setOpen(true)} aria-label={`Сэтгэл санаа ${value}`} aria-pressed={mood === value}
              className={`rounded-2xl py-2 text-3xl transition ${mood === value ? "bb-bg-E9DDFC ring-2 ring-purple-300" : "bg-slate-50 hover:bb-bg-FDE7F1"}`}>
              {emoji}
            </button>
          ))}
        </div>
      </Card>
      {open && <DayLogSheet date={date} initialMood={mood} isPeriodDay={periodDay} onClose={() => setOpen(false)} onSaved={(row) => { setMood(row.mood); setHasLog(true); }} />}
    </>
  );
}
