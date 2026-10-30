"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { localDateKey } from "../../../lib/cycle";
import { LOG_ENTRIES_CHANGED, MOODS, fetchEntries, latestOf, saveEntry } from "../../../lib/log-entries";
import { supabase } from "../../../lib/supabase";
import Card from "../ui/Card";
import DayDetailSheet from "./DayDetailSheet";
import { t } from "../../../lib/i18n";

/** Today's quick mood (one tap = one mood entry) + the same day view the calendar opens. */
export default function TodayMoodCard() {
  const { profile, setToast, linked, shareWithMom } = useFamily();
  const date = localDateKey(new Date());
  const [mood, setMood] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.id || !supabase) return undefined;
    let cancelled = false;
    const load = () => fetchEntries(supabase, date, date).then(({ data, error }) => {
      if (!cancelled && !error) setMood(latestOf(data, "mood")?.value?.mood ?? null);
    });
    load();
    window.addEventListener(LOG_ENTRIES_CHANGED, load);
    return () => { cancelled = true; window.removeEventListener(LOG_ENTRIES_CHANGED, load); };
  }, [date, profile?.id]);

  const pick = async (value) => {
    if (saving || !profile?.id) return;
    setSaving(true);
    const { error } = await saveEntry(supabase, { userId: profile.id, date, category: "mood", value: { mood: value }, today: date });
    if (error) {
      setSaving(false);
      console.error("[log_entries] mood:", error);
      setToast(t("Хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save. Please try again."));
      return;
    }
    if (linked && shareWithMom) {
      const { error: shareError } = await supabase.rpc("set_my_day_share_mood", { p_log_date: date, p_share: true });
      if (shareError) {
        console.error("[day_logs] share_mood:", shareError);
        setSaving(false);
        setMood(value);
        setToast(t("Сэтгэл санааг хадгаллаа, хуваалцаж чадсангүй", "Mood saved, but couldn't share it"));
        return;
      }
    }
    setSaving(false);
    setMood(value);
    setToast(t("Хадгаллаа", "Saved"));
  };

  return (
    <>
      <Card className="!p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-700">{t("Өнөөдөр ямар байна?", "How are you today?")}</h2>
          <button type="button" onClick={() => setOpen(true)} className="text-xs font-extrabold bb-text-B83B7E">{t("Өдрийн тэмдэглэл", "Daily log")}</button>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {MOODS.map(({ value, emoji, label }) => (
            <button key={value} type="button" disabled={saving} onClick={() => pick(value)} aria-label={label} aria-pressed={mood === value}
              className={`rounded-2xl py-2 text-3xl transition disabled:opacity-60 ${mood === value ? "bb-bg-E9DDFC ring-2 ring-purple-300" : "bg-slate-50 hover:bb-bg-FDE7F1"}`}>
              {emoji}
            </button>
          ))}
        </div>
      </Card>
      {open && <DayDetailSheet date={date} onClose={() => setOpen(false)} />}
    </>
  );
}
