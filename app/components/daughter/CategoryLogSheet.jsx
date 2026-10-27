"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { localDateKey } from "../../../lib/cycle";
import {
  CATEGORY_BY_KEY, FLOWS, MOODS, PAINS, SKIN, SLEEP_DEFAULT, SLEEP_MAX, SLEEP_MIN, SLEEP_QUALITY, SYMPTOM_ITEMS,
  deleteEntry, saveEntry,
} from "../../../lib/log-entries";
import { supabase } from "../../../lib/supabase";
import BottomSheet from "../ui/BottomSheet";

const chip = (active) => `rounded-full border px-3 py-2 text-xs font-extrabold transition ${active ? "bb-bg-FDE7F1 bb-border-E0679F bb-text-B83B7E" : "border-slate-200 bg-white text-slate-500"}`;
const tile = (active) => `rounded-2xl px-1 py-2.5 text-xs font-extrabold transition ${active ? "bb-bg-FDE7F1 bb-text-B83B7E ring-1 ring-pink-300" : "bg-slate-50 text-slate-500"}`;
const toggle = (list, key) => (list.includes(key) ? list.filter((item) => item !== key) : [...list, key]);

function initialValue(category, entry) {
  const value = entry?.value ?? {};
  switch (category) {
    case "mood": return { mood: value.mood ?? null };
    case "skin": return { items: value.items ?? [] };
    case "symptoms": return { pain: value.pain ?? null, items: value.items ?? [] };
    case "period": return { flow: value.flow ?? null };
    case "sleep": return { hours: value.hours ?? SLEEP_DEFAULT, quality: value.quality ?? null };
    default: return {};
  }
}

const ready = (category, value) => {
  if (category === "mood") return value.mood != null;
  if (category === "skin") return value.items.length > 0;
  if (category === "symptoms") return value.items.length > 0 || value.pain != null;
  if (category === "period") return Boolean(value.flow);
  if (category === "sleep") return Boolean(value.quality);
  return false;
};

/** One-tap log sheet for a single category; with `entry` it edits/deletes that entry. */
export default function CategoryLogSheet({ date, category, entry = null, isPeriodDay = false, onClose }) {
  const { profile, setToast, linked, guardianName, shareWithMom, startPeriod, savePeriodStartDates, periodStarts } = useFamily();
  const today = localDateKey(new Date());
  const meta = CATEGORY_BY_KEY[category];
  const [value, setValue] = useState(() => initialValue(category, entry));
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [askStart, setAskStart] = useState(false);
  const [shareMood, setShareMood] = useState(false);
  const [sharedBefore, setSharedBefore] = useState(false);

  useEffect(() => {
    if (category !== "mood" || !supabase) return;
    let cancelled = false;
    supabase.rpc("get_my_day_logs", { p_from: date, p_to: date }).then(({ data }) => {
      if (cancelled) return;
      const shared = Boolean(data?.[0]?.share_mood);
      setShareMood(shared);
      setSharedBefore(shared);
    });
    return () => { cancelled = true; };
  }, [category, date]);

  const fail = (error) => {
    console.error(`[log_entries] ${category}:`, error);
    setToast("Хадгалж чадсангүй. Дахин оролдоно уу.");
  };

  const save = async () => {
    if (busy || !ready(category, value) || !profile?.id) return;
    setBusy(true);
    const { error } = await saveEntry(supabase, { id: entry?.id, userId: profile.id, date, category, value, today });
    if (error) { setBusy(false); fail(error); return; }
    // Sharing is per day and only ever covers mood (get_shared_daily_moods).
    const share = shareMood && shareWithMom && linked;
    if (category === "mood" && share !== sharedBefore) {
      const { error: shareError } = await supabase.rpc("set_my_day_share_mood", { p_log_date: date, p_share: share });
      if (shareError) console.error("[day_logs] share_mood:", shareError);
    }
    setBusy(false);
    setToast("Хадгаллаа");
    if (category === "period" && !entry && !isPeriodDay) setAskStart(true);
    else onClose();
  };

  const remove = async () => {
    if (busy || !entry) return;
    setBusy(true);
    const { error } = await deleteEntry(supabase, entry);
    setBusy(false);
    if (error) { fail(error); return; }
    setToast("Устгалаа");
    onClose();
  };

  const answerStart = async (yes) => {
    if (yes) {
      setBusy(true);
      // Same period-start logic as the "Сарын тэмдэг маань өнөөдөр ирлээ" button.
      if (date === today) await startPeriod();
      else if (await savePeriodStartDates([...periodStarts, date])) setToast("Сарын тэмдгийн эхлэлийг тэмдэглэлээ 🌸");
      setBusy(false);
    }
    onClose();
  };

  return (
    <BottomSheet title={`${meta.emoji} ${meta.label}`} onClose={onClose} layer={90}>
      {askStart ? (
        <div className="space-y-3 pb-2">
          <p className="text-base font-black text-slate-700">Сарын тэмдэг эхэлсэн үү?</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => answerStart(false)} className="rounded-2xl bg-slate-50 py-3 text-sm font-extrabold text-slate-500 disabled:opacity-60">Үгүй</button>
            <button type="button" disabled={busy} onClick={() => answerStart(true)} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white disabled:opacity-60">{busy ? "Хадгалж байна…" : "Тийм"}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-2">
          {category === "mood" && <>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((option) => (
                <button key={option.value} type="button" aria-label={option.label} aria-pressed={value.mood === option.value} onClick={() => setValue({ mood: option.value })}
                  className={`rounded-2xl py-2 text-3xl transition ${value.mood === option.value ? "bb-bg-E9DDFC ring-2 ring-purple-300 scale-105" : "bg-slate-50"}`}>
                  {option.emoji}
                </button>
              ))}
            </div>
            <button type="button" role="switch" aria-checked={shareMood && shareWithMom && linked} disabled={!linked || !shareWithMom} onClick={() => setShareMood((current) => !current)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-left disabled:opacity-60">
              <span className="text-sm font-extrabold text-slate-600">{guardianName ? `${guardianName}-тай хуваалцах` : "Асран хамгаалагчтай хуваалцах"}<span className="mt-0.5 block text-[11px] font-semibold text-slate-400">Зөвхөн сэтгэл санаа хуваалцана</span></span>
              <span className={`h-7 w-12 shrink-0 rounded-full p-1 ${shareMood && shareWithMom && linked ? "bb-bg-E0679F" : "bg-slate-200"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${shareMood && shareWithMom && linked ? "translate-x-5" : ""}`} /></span>
            </button>
          </>}

          {category === "skin" && <div className="flex flex-wrap gap-2">
            {SKIN.map(([key, label]) => <button key={key} type="button" aria-pressed={value.items.includes(key)} onClick={() => setValue({ items: toggle(value.items, key) })} className={chip(value.items.includes(key))}>{label}</button>)}
          </div>}

          {category === "symptoms" && <>
            <section>
              <h3 className="mb-2 text-sm font-extrabold text-slate-700">Өвдөлт</h3>
              <div className="grid grid-cols-4 gap-2">
                {PAINS.map(([key, label]) => <button key={key} type="button" aria-pressed={value.pain === key} onClick={() => setValue({ ...value, pain: value.pain === key ? null : key })} className={tile(value.pain === key)}>{label}</button>)}
              </div>
            </section>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_ITEMS.map(([key, label]) => <button key={key} type="button" aria-pressed={value.items.includes(key)} onClick={() => setValue({ ...value, items: toggle(value.items, key) })} className={chip(value.items.includes(key))}>{label}</button>)}
            </div>
          </>}

          {category === "period" && <div className="grid grid-cols-4 gap-2">
            {FLOWS.map(([key, label]) => <button key={key} type="button" aria-pressed={value.flow === key} onClick={() => setValue({ flow: key })} className={tile(value.flow === key)}>{label}</button>)}
          </div>}

          {category === "sleep" && <>
            <div className="flex items-center justify-center gap-5">
              <button type="button" aria-label="Хасах" disabled={value.hours <= SLEEP_MIN} onClick={() => setValue({ ...value, hours: Math.max(SLEEP_MIN, value.hours - 0.5) })} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-600 disabled:opacity-40"><Minus className="h-5 w-5" /></button>
              <p className="min-w-24 text-center text-2xl font-black text-slate-700" aria-live="polite">{value.hours} <span className="text-sm">цаг</span></p>
              <button type="button" aria-label="Нэмэх" disabled={value.hours >= SLEEP_MAX} onClick={() => setValue({ ...value, hours: Math.min(SLEEP_MAX, value.hours + 0.5) })} className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-600 disabled:opacity-40"><Plus className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SLEEP_QUALITY.map(([key, label, emoji]) => <button key={key} type="button" aria-pressed={value.quality === key} onClick={() => setValue({ ...value, quality: key })} className={tile(value.quality === key)}>{label} {emoji}</button>)}
            </div>
          </>}

          {confirmDelete ? (
            <div className="rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-extrabold text-slate-700">Энэ бүртгэлийг устгах уу?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className="rounded-xl bg-white py-2.5 text-xs font-extrabold text-slate-500">Болих</button>
                <button type="button" disabled={busy} onClick={remove} className="rounded-xl bg-rose-500 py-2.5 text-xs font-extrabold text-white disabled:opacity-60">Устгах</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {entry && <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="rounded-2xl border-2 border-slate-100 bg-white px-4 py-3.5 text-sm font-extrabold text-rose-500">Устгах</button>}
              <button type="button" onClick={save} disabled={busy || !ready(category, value)} className="flex-1 rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white disabled:opacity-50">{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
