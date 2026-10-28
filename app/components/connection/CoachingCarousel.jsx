"use client";

import { useRef, useState } from "react";
import { useLang } from "../../../context/LanguageContext";
import {
  COACHING, COACHING_EN, COACHING_STEPS, COACHING_STEPS_EN, SIGNAL_LABELS, SIGNAL_LABELS_EN,
} from "../../../lib/emotionCoaching";
import { t } from "../../../lib/i18n";
import BottomSheet from "../ui/BottomSheet";

/** «💡 Яаж хариулах вэ?» — one step per screen, swipe or tap; phrases tailored to the signal type. */
export default function CoachingCarousel({ type, onClose }) {
  const { lang } = useLang();
  const [step, setStep] = useState(0);
  const touchX = useRef(null);
  const steps = lang === "en" ? COACHING_STEPS_EN : COACHING_STEPS;
  const coaching = lang === "en" ? COACHING_EN : COACHING;
  const phrases = coaching[type] ?? coaching.talk;
  const signalLabels = lang === "en" ? SIGNAL_LABELS_EN : SIGNAL_LABELS;
  const go = (delta) => setStep((value) => Math.min(steps.length - 1, Math.max(0, value + delta)));

  return (
    <BottomSheet title={t("💡 Яаж хариулах вэ?", "💡 How to respond")} onClose={onClose} layer={90}>
      <div className="space-y-4 pb-2"
        onTouchStart={(event) => { touchX.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touchX.current == null) return;
          const dx = event.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx < -50) go(1); else if (dx > 50) go(-1);
        }}>
        <p className="text-xs font-black text-slate-400">{signalLabels[type]} · 📝 {t("Ноорог", "Draft")}</p>
        <div key={step} className="bloom-pop space-y-3">
          <p className="text-lg font-black text-slate-800">{steps[step].title}</p>
          <p className="text-sm font-semibold leading-relaxed text-slate-600">{steps[step].lesson}</p>
          <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">✅ {t("Хэлэх", "Say")}: {phrases[step].say}</p>
          <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800">❌ {t("Хэлэхгүй", "Avoid")}: {phrases[step].avoid}</p>
        </div>
        <div className="flex items-center justify-center gap-1.5" aria-label={`${step + 1}/${steps.length}`}>
          {steps.map((item, index) => <span key={item.id} className={`h-1.5 rounded-full ${index === step ? "w-5 bb-bg-E0679F" : "w-1.5 bg-slate-200"}`} />)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={step === 0} onClick={() => go(-1)} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-40">{t("Өмнөх", "Previous")}</button>
          {step < steps.length - 1
            ? <button type="button" onClick={() => go(1)} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">{t("Дараах", "Next")}</button>
            : <button type="button" onClick={onClose} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">{t("Ойлголоо", "Got it")}</button>}
        </div>
      </div>
    </BottomSheet>
  );
}
