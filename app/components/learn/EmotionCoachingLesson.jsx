"use client";

import { useState } from "react";
import { useLang } from "../../../context/LanguageContext";
import { COACHING, COACHING_EN, COACHING_STEPS, COACHING_STEPS_EN } from "../../../lib/emotionCoaching";
import { t } from "../../../lib/i18n";
import BottomSheet from "../ui/BottomSheet";

/** 2-minute lesson «Охиныхоо мэдрэмжид хэрхэн хариулах вэ»: the 5 emotion-coaching steps, one per screen. */
export default function EmotionCoachingLesson({ onClose }) {
  const { lang } = useLang();
  const [step, setStep] = useState(-1);
  const steps = lang === "en" ? COACHING_STEPS_EN : COACHING_STEPS;
  const current = steps[step];
  const example = step >= 0 ? (lang === "en" ? COACHING_EN : COACHING).sad[step] : null;

  return (
    <BottomSheet title={t("Охиныхоо мэдрэмжид хэрхэн хариулах вэ", "How to respond to your daughter's feelings")} onClose={onClose}>
      <div className="space-y-4 pb-2">
        <p className="w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">{t("📝 Ноорог · 2 минут", "📝 Draft · 2 minutes")}</p>
        {step < 0 ? (
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            {t("Охин тань гунигтай, өвдөж эсвэл ганцаардаж байх үед зөвлөгөөнөөс илүү ойлголт хэрэгтэй байдаг. Энэ 5 алхам мэдрэмжийг «засах» биш, хамт байхад тусална.", "When your daughter is sad, in pain, or lonely, she may need understanding more than advice. These five steps help you be with her instead of trying to “fix” the feeling.")}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-lg font-black text-slate-800">{current.title}</p>
            <p className="text-sm font-semibold leading-relaxed text-slate-600">{current.lesson}</p>
            <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">✅ {t("Хэлэх", "Say")}: {example.say}</p>
            <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800">❌ {t("Хэлэхгүй", "Avoid")}: {example.avoid}</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {steps.map((item, index) => <span key={item.id} className={`h-1.5 rounded-full ${index === step ? "w-5 bb-bg-E0679F" : "w-1.5 bg-slate-200"}`} />)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={step < 0} onClick={() => setStep((value) => value - 1)} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-40">{t("Өмнөх", "Previous")}</button>
          {step < steps.length - 1
            ? <button type="button" onClick={() => setStep((value) => value + 1)} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">{step < 0 ? t("Эхлэх", "Start") : t("Дараах", "Next")}</button>
            : <button type="button" onClick={onClose} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">{t("Дуусгах ✓", "Finish ✓")}</button>}
        </div>
      </div>
    </BottomSheet>
  );
}
