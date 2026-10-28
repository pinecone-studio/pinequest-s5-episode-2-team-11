"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { REFLECTION_ANSWERS, REFLECTION_QUESTIONS, isReflectionTime, pickGoal, streak, weekStart } from "../../../lib/reflection";
import { supabase } from "../../../lib/supabase";
import Card from "../ui/Card";

/** Sunday 18:00+: two questions → one goal + 🌱 n/4 streak. Stored in guardian_reflections (guardian-only RLS). */
function ReflectionCard() {
  const { profile, setToast } = useFamily();
  const week = weekStart();
  const [rows, setRows] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (!supabase || !profile?.id) return;
    supabase.from("guardian_reflections").select("week_start, listened, warm, goal").eq("guardian_id", profile.id)
      .order("week_start", { ascending: false }).limit(8)
      .then(({ data, error }) => {
        if (error) console.warn("[reflection]", error.message);
        setRows(data ?? []);
      });
  }, [profile?.id]);

  const thisWeek = rows?.find((row) => row.week_start === week);

  const answer = async (key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (!next.listened || !next.warm) return;
    const goal = pickGoal(next, week);
    const row = { guardian_id: profile.id, week_start: week, listened: next.listened, warm: next.warm, goal };
    const { error } = await supabase.from("guardian_reflections").upsert(row, { onConflict: "guardian_id,week_start" });
    if (error) { console.error("[reflection] save:", error); setToast("Хадгалж чадсангүй. Дахин оролдоно уу."); return; }
    setRows((list) => [row, ...(list ?? []).filter((item) => item.week_start !== week)]);
  };

  if (!rows) return null;
  const count = streak(rows.map((row) => row.week_start));
  return (
    <Card className="!p-4">
      <p className="text-sm font-black text-slate-700">🪞 Энэ долоо хоногт…</p>
      {thisWeek ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Ирэх долоо хоногийн жижиг зорилго</p>
          <p className="rounded-2xl bb-bg-FDE7F1-50 p-3 text-sm font-bold leading-relaxed text-slate-700">{thisWeek.goal}</p>
          <p className="text-xs font-extrabold text-emerald-700">🌱 {count}/4 долоо хоног</p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {REFLECTION_QUESTIONS.map(({ key, text }) => (
            <div key={key}>
              <p className="text-sm font-bold text-slate-700">{text}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {REFLECTION_ANSWERS.map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={answers[key] === value} onClick={() => answer(key, value)}
                    className={`rounded-2xl border-2 py-2 text-xs font-extrabold ${answers[key] === value ? "bb-border-F48FB1 bb-bg-FDE7F1 bb-text-B83B7E" : "border-slate-100 bg-white text-slate-600"}`}>{label}</button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] font-semibold text-slate-400">🔒 Зөвхөн танд харагдана · 🌱 {count}/4 долоо хоног</p>
        </div>
      )}
    </Card>
  );
}

/** Guardian home: daily tip Mon–Sat (and Sunday before 18:00); weekly reflection on Sunday evening. */
export default function DailyTipCard() {
  const { currentNudge, markNudgeDone } = useFamily();
  const [reflection, setReflection] = useState(false);
  useEffect(() => {
    const check = () => setReflection(isReflectionTime());
    check();
    const timer = setInterval(check, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (reflection) return <ReflectionCard />;
  if (!currentNudge) return null;
  return (
    <Card className="!p-4">
      <p className="flex items-center gap-1.5 text-sm font-black text-slate-700"><Lightbulb className="h-4 w-4 bb-text-B83B7E" /> Өнөөдрийн зөвлөгөө</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">{String(currentNudge)}</p>
      {markNudgeDone && <button type="button" onClick={markNudgeDone} className="mt-3 rounded-full bb-bg-FDE7F1 px-3 py-1.5 text-xs font-extrabold bb-text-B83B7E">Хийлээ ✓</button>}
    </Card>
  );
}
