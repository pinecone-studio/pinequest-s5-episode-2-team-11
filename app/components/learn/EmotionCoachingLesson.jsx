"use client";

import { useState } from "react";
import { COACHING, COACHING_STEPS } from "../../../lib/emotionCoaching";
import BottomSheet from "../ui/BottomSheet";

/** 2-minute lesson «Охиныхоо мэдрэмжид хэрхэн хариулах вэ»: the 5 emotion-coaching steps, one per screen. */
export default function EmotionCoachingLesson({ onClose }) {
  const [step, setStep] = useState(-1);
  const current = COACHING_STEPS[step];
  const example = step >= 0 ? COACHING.sad[step] : null;

  return (
    <BottomSheet title="Охиныхоо мэдрэмжид хэрхэн хариулах вэ" onClose={onClose}>
      <div className="space-y-4 pb-2">
        <p className="w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">📝 Ноорог · 2 минут</p>
        {step < 0 ? (
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            Охин тань гунигтай, өвдөж эсвэл ганцаардаж байх үед зөвлөгөөнөөс илүү ойлголт хэрэгтэй байдаг. Энэ 5 алхам мэдрэмжийг «засах» биш, хамт байхад тусална.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-lg font-black text-slate-800">{current.title}</p>
            <p className="text-sm font-semibold leading-relaxed text-slate-600">{current.lesson}</p>
            <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">✅ Хэлэх: {example.say}</p>
            <p className="rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-800">❌ Хэлэхгүй: {example.avoid}</p>
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {COACHING_STEPS.map((item, index) => <span key={item.id} className={`h-1.5 rounded-full ${index === step ? "w-5 bb-bg-E0679F" : "w-1.5 bg-slate-200"}`} />)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={step < 0} onClick={() => setStep((value) => value - 1)} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600 disabled:opacity-40">Өмнөх</button>
          {step < COACHING_STEPS.length - 1
            ? <button type="button" onClick={() => setStep((value) => value + 1)} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">{step < 0 ? "Эхлэх" : "Дараах"}</button>
            : <button type="button" onClick={onClose} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">Дуусгах ✓</button>}
        </div>
      </div>
    </BottomSheet>
  );
}
