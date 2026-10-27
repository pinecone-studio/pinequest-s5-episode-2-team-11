"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { supabase } from "../../../lib/supabase";
import { dateLabelMongolian, localDateKey } from "../../../lib/cycle";
import BottomSheet from "../ui/BottomSheet";

const MOODS = [
  { value: 5, emoji: "😄", label: "Маш сайхан" },
  { value: 4, emoji: "🙂", label: "Сайхан" },
  { value: 3, emoji: "😐", label: "Дундаж" },
  { value: 2, emoji: "😟", label: "Тавгүй" },
  { value: 1, emoji: "😣", label: "Хэцүү" },
];
const SYMPTOMS = [
  ["tired", "Ядрах"],
  ["acne", "Батга"],
  ["bloating", "Хэвлий дүүрэх"],
  ["breast_tenderness", "Хөх өвдөх"],
  ["headache", "Толгой өвдөх"],
];
const FLOWS = [["light", "Бага"], ["medium", "Дунд"], ["heavy", "Их"]];
const PAINS = [[0, "Өвдөхгүй"], [1, "Бага"], [2, "Дунд"], [3, "Их"]];
const LEGACY_MOOD = { Happy: 5, Calm: 4, Sad: 2, Anxious: 2, Embarrassed: 3, Irritable: 2 };
const LEGACY_SYMPTOM = { Cramps: "cramps", Fatigue: "tired", Spots: "acne", Bloating: "bloating", Tenderness: "breast_tenderness", Headache: "headache" };
const LEGACY_FLOW = { Light: "light", Medium: "medium", Heavy: "heavy", Spotting: "light" };
const LEGACY_EMOTION_BY_SCORE = { 1: "Sad", 2: "Anxious", 3: "Calm", 4: "Calm", 5: "Happy" };
const LEGACY_SYMPTOM_BY_KEY = Object.fromEntries(Object.entries(LEGACY_SYMPTOM).map(([legacy, key]) => [key, legacy]));

function legacyValues(date) {
  let log = {};
  try {
    const saved = JSON.parse(localStorage.getItem(`bloom:tracker-log:${date}`) ?? "null");
    log = saved?.AM || saved?.PM ? { ...saved.AM, ...saved.PM } : saved ?? {};
  } catch { /* хуучин тэмдэглэлийг алгасна */ }
  let checkin = null;
  try { checkin = JSON.parse(localStorage.getItem(`bloom:checkin:${date}`) ?? "null"); } catch { /* хуучин тэмдэглэлийг алгасна */ }
  return {
    mood: LEGACY_MOOD[log.emotion] ?? checkin?.mood ?? null,
    symptoms: log.symptoms && LEGACY_SYMPTOM[log.symptoms] ? [LEGACY_SYMPTOM[log.symptoms]] : checkin?.pain > 1 ? ["cramps"] : [],
    flow: LEGACY_FLOW[log.period] ?? null,
    note: "",
    share_mood: false,
  };
}

export default function DayLogSheet({ date, initialMood = null, isPeriodDay = false, periodDayNumber = 1, pendingPeriod = null, onClose, onSaved }) {
  const { profile, session, noteUnlockToken, unlockPrivateNotes, linked, guardianName, shareWithMom, setToast, refreshMoods, respondPeriodEntry } = useFamily();
  const today = localDateKey(new Date());
  const future = date > today;
  const selectedDate = new Date(`${date}T00:00:00`);
  const title = date === today ? "Өнөөдөр ямар байна?" : dateLabelMongolian(selectedDate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");
  const [mood, setMood] = useState(initialMood);
  const [pain, setPain] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [flow, setFlow] = useState(null);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [notePin, setNotePin] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [shareMood, setShareMood] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      if (!supabase || !profile?.id) {
        if (!cancelled) { setLoading(false); setError("Өдрийн бүртгэл ачаалж чадсангүй."); }
        return;
      }
      const { data, error: loadError } = await supabase.rpc("get_my_day_logs", { p_from: date, p_to: date });
      if (cancelled) return;
      if (loadError) {
        setError("Бүртгэл ачаалж чадсангүй. Шинэчлэлээ Supabase дээр ажиллуулна уу.");
      } else {
        const row = data?.[0];
        const legacy = legacyValues(date);
        setMood(row?.mood ?? legacy.mood ?? initialMood ?? null);
        setPain(row?.pain ?? (row?.symptoms?.includes("cramps") ? 2 : legacy.symptoms.includes("cramps") ? 2 : null));
        setSymptoms(row?.symptoms ?? legacy.symptoms);
        setFlow(row?.flow ?? legacy.flow);
        setNote("");
        setShareMood(Boolean(row?.share_mood));
        const status = await fetch("/api/private-notes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ action: "status", date }), cache: "no-store" });
        const lock = status.ok ? await status.json() : { enabled: false, hasNote: false };
        if (cancelled) return;
        setPinEnabled(Boolean(lock.enabled));
        const needsPin = Boolean(lock.enabled && lock.hasNote && !noteUnlockToken);
        setPinRequired(needsPin);
        if (!needsPin && lock.hasNote) await fetchNote(noteUnlockToken);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [date, initialMood, profile?.id, session?.access_token, noteUnlockToken]);

  const fetchNote = async (token) => {
    const response = await fetch("/api/private-notes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}`, ...(token ? { "x-note-unlock-token": token } : {}) }, body: JSON.stringify({ action: "note", date }), cache: "no-store" });
    const result = await response.json();
    if (response.ok) setNote(result.note ?? "");
    else if (response.status === 423) { setPinRequired(true); setNote(""); }
    else setError(result.error || "Тэмдэглэл ачаалж чадсангүй.");
  };

  const unlockNote = async (event) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(notePin) || pinBusy) return;
    setPinBusy(true); setError("");
    try {
      const response = await fetch("/api/private-notes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ action: "verify", pin: notePin }), cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "PIN шалгаж чадсангүй.");
      unlockPrivateNotes(result.token);
      setPinRequired(false); setNotePin("");
      await fetchNote(result.token);
    } catch (e) { setError(e.message); }
    finally { setPinBusy(false); }
  };

  const toggleSymptom = (key) => setSymptoms((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  const decidePeriod = async (approve) => {
    if (!pendingPeriod || responding) return;
    setResponding(true);
    const ok = await respondPeriodEntry(pendingPeriod.id, approve);
    setResponding(false);
    if (ok) onClose();
  };
  const save = async () => {
    if (future || saving || !profile?.id) return;
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase.rpc("save_my_day_log", {
      p_log_date: date,
      p_mood: mood,
      p_pain: pain,
      p_symptoms: symptoms,
      p_flow: isPeriodDay ? flow : null,
      p_note: note.trim() || null,
      p_share_mood: shareMood && shareWithMom,
    });
    setSaving(false);
    if (saveError) {
      setError("Хадгалж чадсангүй. Supabase-ийн шинэ migration ажилласан эсэхийг шалгана уу.");
      return;
    }
    localStorage.removeItem(`bloom:checkin:${date}`);
    localStorage.setItem(`bloom:tracker-log:${date}`, JSON.stringify({
      emotion: mood ? LEGACY_EMOTION_BY_SCORE[mood] : undefined,
      symptoms: symptoms.map((item) => LEGACY_SYMPTOM_BY_KEY[item]).find(Boolean),
      period: ({ light: "Light", medium: "Medium", heavy: "Heavy" })[isPeriodDay ? flow : ""] ?? undefined,
    }));
    localStorage.removeItem(`bloom:private-note:${date}`);
    await refreshMoods();
    setToast("Хадгаллаа");
    onSaved?.({ log_date: date, mood, pain, symptoms, flow: isPeriodDay ? flow : null, note: note.trim(), share_mood: shareMood && shareWithMom });
    onClose();
  };

  return (
    <BottomSheet title={title} onClose={onClose}>
      {future ? (
        <p className="mb-2 rounded-2xl bb-bg-E9DDFC-50 p-4 text-sm font-bold bb-text-7C4DCC">Энэ өдөр хараахан болоогүй байна</p>
      ) : loading ? (
        <p className="py-8 text-center text-sm font-bold text-slate-400">Бүртгэл ачаалж байна…</p>
      ) : (
        <div className="space-y-5 pb-2">
          {pendingPeriod && <section className="rounded-2xl bb-bg-FDE7F1-50 p-3"><p className="text-sm font-bold leading-relaxed text-slate-600">Асран хамгаалагч энэ өдрийг сарын тэмдэг эхэлсэн гэж санал болгосон. Баталгаажуулах уу?</p><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" disabled={responding} onClick={() => decidePeriod(false)} className="rounded-xl bg-white py-2.5 text-xs font-extrabold text-slate-500 disabled:opacity-60">Үгүй</button><button type="button" disabled={responding} onClick={() => decidePeriod(true)} className="rounded-xl bb-bg-E0679F py-2.5 text-xs font-extrabold text-white disabled:opacity-60">{responding ? "Хадгалж байна…" : "Баталгаажуулах"}</button></div></section>}
          {isPeriodDay && <p className="w-fit rounded-full bb-bg-FDE7F1 px-3 py-1.5 text-xs font-extrabold bb-text-B83B7E">Сарын тэмдгийн {periodDayNumber} дэх өдөр</p>}
          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slate-700">Сэтгэл санаа</h3>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((option) => (
                <button key={option.value} type="button" onClick={() => setMood(option.value)} aria-label={option.label} aria-pressed={mood === option.value}
                  className={`rounded-2xl py-2 text-3xl transition ${mood === option.value ? "bb-bg-E9DDFC ring-2 ring-purple-300 scale-105" : "bg-slate-50"}`}>
                  {option.emoji}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slate-700">Өвдөлт</h3>
            <div className="grid grid-cols-4 gap-2">
              {PAINS.map(([value, label]) => <button key={value} type="button" aria-pressed={pain === value} onClick={() => setPain(pain === value ? null : value)} className={`rounded-2xl px-1 py-2.5 text-xs font-extrabold ${pain === value ? "bb-bg-FDE7F1 bb-text-B83B7E ring-1 ring-pink-300" : "bg-slate-50 text-slate-500"}`}>{label}</button>)}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-extrabold text-slate-700">Бусад</h3>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(([key, label]) => {
                const active = symptoms.includes(key);
                return <button key={key} type="button" aria-pressed={active} onClick={() => toggleSymptom(key)} className={`rounded-full border px-3 py-2 text-xs font-extrabold transition ${active ? "bb-bg-FDE7F1 bb-border-E0679F bb-text-B83B7E" : "border-slate-200 bg-white text-slate-500"}`}>{label}</button>;
              })}
            </div>
          </section>

          {isPeriodDay && <section>
            <h3 className="mb-2 text-sm font-extrabold text-slate-700">Цус</h3>
            <div className="grid grid-cols-3 gap-2">
              {FLOWS.map(([key, label]) => <button key={key} type="button" aria-pressed={flow === key} onClick={() => setFlow(flow === key ? null : key)} className={`rounded-2xl py-2.5 text-sm font-extrabold ${flow === key ? "bb-bg-FDE7F1 bb-text-B83B7E ring-1 ring-pink-300" : "bg-slate-50 text-slate-500"}`}>{label}</button>)}
            </div>
          </section>}

          <section>
            <button type="button" onClick={() => setNoteOpen((value) => !value)} aria-expanded={noteOpen} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-3 text-left text-sm font-extrabold text-slate-700"><span className="flex items-center gap-2"><Lock className="h-4 w-4 bb-text-7C4DCC" /> 🔒 Нууц тэмдэглэл</span><span className="text-xs bb-text-B83B7E">{noteOpen ? "Хураах" : note ? "Нээх" : "Нэмэх"}</span></button>
            {noteOpen && (pinRequired ? <form onSubmit={unlockNote} className="mt-2 space-y-2"><p className="text-xs font-semibold text-slate-500">Хадгалсан тэмдэглэлээ үзэхийн тулд PIN-ээ оруулна уу.</p><div className="flex gap-2"><input aria-label="Нууц тэмдэглэлийн PIN" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={notePin} onChange={(event) => setNotePin(event.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="PIN" /><button type="submit" disabled={pinBusy} className="rounded-xl bb-bg-E0679F px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{pinBusy ? "Шалгаж байна…" : "Нээх"}</button></div></form> : <><textarea id="private-day-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} placeholder="Өөр юу болсон бэ?" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-pink-300" /><p className="mt-1 text-xs font-semibold text-slate-400">{pinEnabled ? "PIN-ээр хамгаалагдсан. Зөвхөн чамд харагдана." : "Зөвхөн чамд харагдана"}</p></>)}
          </section>

          <button type="button" role="switch" aria-checked={shareMood && shareWithMom} disabled={!linked || !shareWithMom} onClick={() => setShareMood((value) => !value)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-left disabled:opacity-60">
            <span className="text-sm font-extrabold text-slate-600">{guardianName ? `${guardianName}-тай хуваалцах` : "Асран хамгаалагчтай хуваалцах"}<span className="mt-0.5 block text-[11px] font-semibold text-slate-400">Зөвхөн сэтгэл санаа хуваалцана</span></span>
            <span className={`h-7 w-12 shrink-0 rounded-full p-1 ${shareMood && shareWithMom ? "bb-bg-E0679F" : "bg-slate-200"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${shareMood && shareWithMom ? "translate-x-5" : ""}`} /></span>
          </button>
          {!shareWithMom && <p className="-mt-3 text-xs font-semibold text-slate-400">Профайлын Нууцлал тохиргоо унтраалттай байна.</p>}
          {!linked && <p className="-mt-3 text-xs font-semibold text-slate-400">Хуваалцахын тулд асран хамгаалагчтай холбогдоорой.</p>}
          {error && <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>}
          <button type="button" onClick={save} disabled={saving} className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white shadow-sm disabled:opacity-60">{saving ? "Хадгалж байна…" : "Хадгалах"}</button>
        </div>
      )}
    </BottomSheet>
  );
}