"use client";

import { useFamily } from "../../context/FamilyContext";
import { Copy, Share2, Users, Sparkles, Bell, Check, Lock, RefreshCw } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import ThinkingDots from "../ui/ThinkingDots";

export default function MotherHome() {
  const {
    familyCode,
    linked,
    daughterName,
    copied,
    day,
    shareWithMom,
    momInbox,
    nudgeLoading,
    nudgesDone,
    phase,
    isPeriod,
    hasCycle,
    daysLate,
    profile,
    daysUntil,
    momUnread,
    selectedMood,
    currentNudge,
    copyCode,
    shareCode,
    refreshNudge,
    markNudgeDone,
    openBell,
    careMessage,
  } = useFamily();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between bloom-fade">
        <div>
          <p className="text-sm font-bold text-slate-400">
            Сайн байна уу{profile?.display_name ? `, ${profile.display_name}` : ""} 🤍
          </p>
          <h2 className="text-2xl font-black text-slate-700">Гэр бүлийн халамж</h2>
        </div>
        <div className="relative">
          <button
            onClick={openBell}
            className="relative w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm active:scale-95"
            aria-label="Мэдэгдэл"
          >
            <Bell className={`w-5 h-5 text-slate-600 ${momUnread ? "bloom-wiggle" : ""}`} />
            {momUnread > 0 && (
              <span
                style={{ minWidth: 20 }}
                className="absolute -top-1 -right-1 h-5 px-1 rounded-full bb-bg-F2A68F text-white text-xs font-black flex items-center justify-center"
              >
                {momUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {!linked && (
        <Card className="bb-grad-5">
          <SectionTitle icon={Users} title="Охиноо урих" />
          <div className="flex items-center gap-2">
            <span className="flex-1 rounded-2xl bg-white border-2 border-dashed bb-border-A5D6A7 py-3 text-center text-lg font-black tracking-wider bb-text-4F8A55">
              {familyCode}
            </span>
            <button
              onClick={copyCode}
              className="w-12 h-12 rounded-2xl bb-bg-5E9E64 text-white flex items-center justify-center active:scale-90"
              aria-label="Кодыг хуулах"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={shareCode}
              className="w-12 h-12 rounded-2xl bg-white border-2 bb-border-A5D6A7 bb-text-4F8A55 flex items-center justify-center active:scale-90"
              aria-label="Кодыг хуваалцах"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Охин тань Bloomy-д охины бүртгэлээр бүртгүүлээд энэ кодыг оруулна. Холбогдмогц энд шууд
            харагдана.
          </p>
        </Card>
      )}

      {/* Халамжийн статус */}
      <div className="rounded-3xl p-5 bb-grad-6 text-white shadow-xl bb-shadow-81C784-30 relative overflow-hidden bloom-fade">
        <span className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <span className="absolute right-10 -bottom-16 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex flex-col items-center justify-center shrink-0">
            {linked && hasCycle ? (
              isPeriod ? (
                <>
                  <span className="text-2xl font-black leading-none">{day}</span>
                  <span className="text-xs font-extrabold">дэх өдөр</span>
                </>
              ) : daysLate > 0 || daysUntil === 0 ? (
                <span className="text-2xl">⏳</span>
              ) : (
                <>
                  <span className="text-2xl font-black leading-none">{daysUntil}</span>
                  <span className="text-xs font-extrabold">хоног</span>
                </>
              )
            ) : linked ? (
              <span className="text-2xl">🌱</span>
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">
              Охины халамжийн статус
            </p>
            <p className="mt-1 font-extrabold text-lg leading-snug">{careMessage}</p>
            {linked && hasCycle && (
              <span className="inline-block mt-2 text-xs font-extrabold bg-white/25 rounded-full px-2.5 py-1">
                {phase.name}
              </span>
            )}
          </div>
        </div>
        {linked && (
          <div className="relative mt-4 rounded-2xl bg-white/15 px-4 py-3">
            {shareWithMom ? (
              selectedMood ? (
                <p className="text-xs font-bold">
                  Өнөөдрийн сэтгэл санаа:{" "}
                  <span className="bg-white text-slate-700 rounded-full px-2.5 py-1 ml-1">
                    {selectedMood.emoji} {selectedMood.label}
                  </span>
                </p>
              ) : (
                <p className="text-xs font-bold text-white/90">Өнөөдөр сэтгэл санаагаа тэмдэглээгүй байна.</p>
              )
            ) : (
              <p className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> {daughterName} өнөөдрийн мэдрэмжээ хувьдаа хадгалсан. Энэ бол
                хэвийн 🌿
              </p>
            )}
          </div>
        )}
      </div>

      {momInbox
        .filter((n) => n.kind === "sos" || n.kind === "supply")
        .slice(0, 2)
        .map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-2xl p-4 bloom-pop border-2 ${
              n.kind === "sos" ? "bb-bg-FFD8CC-50 bb-border-F2A68F-50" : "bb-bg-FAF8F5 bb-border-F5C7A9-60"
            }`}
          >
            <span className="text-2xl">{n.kind === "sos" ? "🆘" : "🛍️"}</span>
            <div className="flex-1">
              <p className="font-extrabold text-sm text-slate-700">{n.text}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}

      {/* AI халамжийн сануулга */}
      <Card className="bb-grad-7">
        <SectionTitle
          icon={Sparkles}
          title="AI халамжийн сануулга"
          tone="peach"
          right={
            <button
              onClick={refreshNudge}
              className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center active:scale-90"
              aria-label="Өөр санаа"
            >
              <RefreshCw className={`w-4 h-4 bb-text-C2674F ${nudgeLoading ? "animate-spin" : ""}`} />
            </button>
          }
        />
        {nudgeLoading ? (
          <ThinkingDots label="Танд тохирох санаа бэлдэж байна…" />
        ) : (
          <div key={currentNudge} className="bloom-pop">
            <p className="text-lg font-extrabold text-slate-700 leading-snug">{currentNudge}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={markNudgeDone}
                disabled={!linked}
                className="flex-1 rounded-2xl bb-bg-5E9E64 disabled:bg-slate-200 text-white font-extrabold py-3 text-sm active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Хийлээ
              </button>
              <button
                onClick={refreshNudge}
                className="px-4 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-extrabold text-sm active:scale-95"
              >
                Өөр санаа
              </button>
            </div>
          </div>
        )}
        {nudgesDone.length > 0 && (
          <p className="mt-3 text-xs font-bold bb-text-4F8A55">
            ✓ Өнөөдөр {nudgesDone.length} халамж үзүүлсэн байна
          </p>
        )}
      </Card>
    </div>
  );
}
