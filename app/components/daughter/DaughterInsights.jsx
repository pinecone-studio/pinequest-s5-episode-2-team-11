"use client";

import { useFamily } from "../../../context/FamilyContext";
import {
  Check,
  Timer,
  Lock,
  Unlock,
  Pause,
  RefreshCw,
  Music,
  Cookie,
  Zap,
  Brain,
  Activity,
} from "lucide-react";
import { MOOD_OPTIONS } from "../../../lib/data";
import { formatSeconds } from "../../../lib/helpers";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import AiBadge from "../ui/AiBadge";
import ThinkingDots from "../ui/ThinkingDots";

export default function DaughterInsights() {
  const {
    mood,
    shareWithMom,
    setShareWithMom,
    insightLoading,
    moodLoading,
    moodTimer,
    setMoodTimer,
    moodTimerRunning,
    setMoodTimerRunning,
    phase,
    selectedMood,
    insightTips,
    pulseSync,
    refreshInsight,
    pickMood,
  } = useFamily();

  return (
    <div className="space-y-4">
      <PageHeader sub="Таны мөчлөгт тааруулсан" title="Өдрийн зөвлөмж ✨" />

      {/* AI өдрийн зөвлөмж */}
      <Card className="bb-grad-4">
        <SectionTitle
          icon={Brain}
          title="Өдрийн ухаалаг зөвлөмж"
          right={
            <div className="flex items-center gap-2">
              <AiBadge />
              <button
                onClick={refreshInsight}
                className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center active:scale-90"
                aria-label="Шинэчлэх"
              >
                <RefreshCw className={`w-4 h-4 bb-text-B83B7E ${insightLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          }
        />
        <p className="text-sm font-semibold text-slate-600 leading-relaxed">{phase.hormoneText}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["Эстроген", phase.estrogen, "#F48FB1"],
            ["Прогестерон", phase.progesterone, "#B794F4"],
          ].map(([label, val, color]) => (
            <div key={label} className="bg-white rounded-2xl p-3 border border-slate-100">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
                <span>{label}</span>
                <span>{val >= 70 ? "Өндөр" : val >= 35 ? "Дунд" : "Бага"}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${val}%`, background: color }}
                />
              </div>
            </div>
          ))}
        </div>

        {insightLoading ? (
          <ThinkingDots label="Шинэ зөвлөмж бэлдэж байна…" />
        ) : (
          <ul className="mt-4 space-y-2">
            {insightTips.map((t, i) => (
              <li
                key={`${i}-${t}`}
                className="bg-white rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 border border-slate-100 bloom-pop"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Сэтгэл санаа таамаглагч */}
      <Card>
        <SectionTitle
          icon={Activity}
          title="Сэтгэл санаа"
          tone="peach"
          right={
            <button
              onClick={() => {
                setShareWithMom((s) => !s);
                pulseSync();
              }}
              className={`flex items-center gap-1 text-xs font-extrabold px-2.5 py-1.5 rounded-full transition ${
                shareWithMom ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bg-slate-100 text-slate-500"
              }`}
            >
              {shareWithMom ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {shareWithMom ? "Ээжтэй хуваалцсан" : "Хувийн"}
            </button>
          }
        />
        <p className="text-xs font-semibold text-slate-500 mb-3">
          Одоогийн мэдрэмжээ сонго — AI танд 2 минутын шийдэл санал болгоно.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {MOOD_OPTIONS.map((m) => {
            const on = mood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => pickMood(m.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl py-3 border-2 transition-all active:scale-95 ${
                  on
                    ? "bb-bg-E9DDFC-60 bb-border-B794F4 scale-105 shadow-md bb-shadow-B794F4-20"
                    : "bb-bg-FFF7FB border-transparent bb-hover-border-E9DDFC"
                }`}
              >
                <span className={`text-3xl transition-transform ${on ? "scale-110" : ""}`}>{m.emoji}</span>
                <span className="text-xs font-extrabold text-slate-600">{m.label}</span>
              </button>
            );
          })}
        </div>

        {selectedMood &&
          (moodLoading ? (
            <ThinkingDots label="Таны мэдрэмжид тохирох шийдэл хайж байна…" />
          ) : (
            <div className="mt-4 rounded-3xl bb-bg-FFF7FB border bb-border-E9DDFC p-4 bloom-pop">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black text-slate-700">{selectedMood.title}</p>
                <AiBadge />
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-500 leading-relaxed">{selectedMood.why}</p>
              <div className="mt-3 space-y-2">
                {[
                  [Cookie, "Хөнгөн зууш", selectedMood.snack],
                  [Music, "Хөгжим", selectedMood.music],
                  [Zap, "2 минутын үйлдэл", selectedMood.action],
                ].map(([Icon, label, text]) => (
                  <div key={label} className="flex items-start gap-3 bg-white rounded-2xl p-3">
                    <span className="w-8 h-8 rounded-xl bb-bg-FDE7F1 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 bb-text-B83B7E" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {label}
                      </p>
                      <p className="text-sm font-bold text-slate-700">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (moodTimer === 0) setMoodTimer(120);
                  setMoodTimerRunning((r) => !r);
                }}
                className={`mt-3 w-full rounded-2xl py-3 font-extrabold text-sm flex items-center justify-center gap-2 transition active:scale-95 ${
                  moodTimer === 0 ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bb-bg-E0679F text-white"
                }`}
              >
                {moodTimer === 0 ? (
                  <>
                    <Check className="w-4 h-4" /> Гайхалтай! Дахин эхлүүлэх үү?
                  </>
                ) : moodTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> {formatSeconds(moodTimer)} — Түр зогсоох
                  </>
                ) : (
                  <>
                    <Timer className="w-4 h-4" /> 2 минутын дасгал эхлүүлэх
                  </>
                )}
              </button>
            </div>
          ))}
      </Card>
    </div>
  );
}
