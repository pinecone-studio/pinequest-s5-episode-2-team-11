"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { Copy, Share2, Users, Check, Lock, HeartHandshake, Send } from "lucide-react";
import { MOM_QUICK_NOTES } from "../../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import ChildrenOverview from "./ChildrenOverview";
import MonthlyCareCarousel from "./MonthlyCareCarousel";

export default function MotherHome() {
  const [customMessage, setCustomMessage] = useState("");
  const {
    familyCode,
    linked,
    daughterName,
    copied,
    day,
    shareWithMom,
    phase,
    isPeriod,
    hasCycle,
    daysLate,
    profile,
    daysUntil,
    selectedMood,
    copyCode,
    shareCode,
    careMessage,
    sendToTeen,
    sendToMom,
    setToast,
  } = useFamily();

  const sendCareMessage = async (message) => {
    const sentToDaughter = await sendToTeen(message, "care");
    if (!sentToDaughter) return false;
    const savedCopy = await sendToMom(`Охиндоо илгээсэн үг: ${message}`, "care");
    setToast(savedCopy ? `${daughterName}-д илгээлээ 💌` : "Охинд илгээлээ, хуулбар мэдэгдэл хадгалагдсангүй.");
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between bloom-fade">
        <div>
          <p className="text-sm font-bold text-slate-400">
            Сайн байна уу{profile?.display_name ? `, ${profile.display_name}` : ""} 🤍
          </p>
          <h2 className="text-2xl font-black text-slate-700">Гэр бүлийн халамж</h2>
        </div>
      </div>

      <ChildrenOverview />

      {!linked && (
        <Card className="bb-grad-5">
          <SectionTitle icon={Users} title="Охиноо урих" />
          <div className="flex items-center gap-2">
            <span className="flex-1 rounded-2xl bg-white border-2 border-dashed bb-border-CDB4F5 py-3 text-center text-lg font-black tracking-wider bb-text-B83B7E">
              {familyCode}
            </span>
            <button
              onClick={copyCode}
              className="w-12 h-12 rounded-2xl bb-bg-E0679F text-white flex items-center justify-center active:scale-90"
              aria-label="Кодыг хуулах"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={shareCode}
              className="w-12 h-12 rounded-2xl bg-white border-2 bb-border-CDB4F5 bb-text-B83B7E flex items-center justify-center active:scale-90"
              aria-label="Кодыг хуваалцах"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Охинтойгоо холбогдох кодоо охиндоо илгээгээрэй. Охин тань Profile хэсэгт энэ кодыг
            оруулснаар тантай холбогдоно.
          </p>
        </Card>
      )}

      {/* Халамжийн статус */}
      <div className="rounded-3xl p-5 bb-grad-6 text-white shadow-xl bb-shadow-F48FB1-30 relative overflow-hidden bloom-fade">
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
                хэвийн 🌸
              </p>
            )}
          </div>
        )}
      </div>

      {/* AI сарын халамжийн зөвлөгөө (охин бүрээр шудрана) */}
      {linked && <MonthlyCareCarousel />}

      {linked && (
        <Card>
          <SectionTitle icon={HeartHandshake} title="Охиндоо зөөлөн үг илгээх" />
          <div className="flex flex-wrap gap-2">
            {MOM_QUICK_NOTES.map((message) => (
              <button
                key={message}
                type="button"
                onClick={() => sendCareMessage(message)}
                className="rounded-full bb-bg-FFF7FB border-2 border-slate-100 text-slate-700 text-xs font-extrabold px-3 py-2 bb-hover-border-CDB4F5 active:scale-95 transition"
              >
                {message}
              </button>
            ))}
          </div>
          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const message = customMessage.trim();
              if (!message) return;
              if (await sendCareMessage(message)) setCustomMessage("");
            }}
          >
            <input
              value={customMessage}
              onChange={(event) => setCustomMessage(event.target.value)}
              maxLength={300}
              placeholder="Өөрийн үгээ энд бичээрэй…"
              aria-label="Охиндоо илгээх зөөлөн үг"
              className="min-w-0 flex-1 rounded-2xl border-2 border-pink-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:border-pink-300 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!customMessage.trim()}
              aria-label="Охиндоо илгээх"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bb-bg-E0679F text-white disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
