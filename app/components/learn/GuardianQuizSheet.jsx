"use client";

import { useState } from "react";
import { useLang } from "../../../context/LanguageContext";
import { GUARDIAN_QUIZ } from "../../../lib/guardianQuiz";
import { t } from "../../../lib/i18n";
import BottomSheet from "../ui/BottomSheet";
import TrueFalseCard from "./TrueFalseCard";

const ENGLISH_COPY = {
  bath: ["You should not bathe during your period.", "Taking a shower and washing your hair are healthy and may ease pain."],
  irregular: ["Irregular cycles are normal during the first 1–2 years.", "Cycles can vary from 21 to 45 days while the body adjusts."],
  length: ["Periods usually last 2–7 days.", "2–7 days is typical. Talk to a doctor if bleeding lasts longer than 7 days."],
  heavy: ["If you need to change a pad every 1–2 hours, you should talk to a doctor.", "If very heavy bleeding continues for several hours, seek medical advice."],
  pain: ["Severe pain is normal and should be endured.", "Mild cramps can be normal. If severe pain keeps you from school, talk to a doctor."],
  sport: ["You should not exercise during your period.", "Gentle movement can help ease cramps."],
  age: ["A first period usually comes between ages 10 and 15.", "Every girl is different. Ask a doctor if it starts before age 8 or hasn't started by age 15."],
  "who-starts": ["A girl should be the one to start conversations about periods.", "It can be much easier for a girl when an adult starts the conversation calmly and simply."],
  mood: ["Mood changes before a period are normal.", "Hormone changes can cause tiredness and emotional changes. Offer support instead of criticism."],
  secret: ["Periods should be kept secret from family.", "Periods are nothing to be ashamed of. Talking about them at home helps girls ask for support."],
};

const DraftBadge = () => <p className="w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">{t("📝 Ноорог · мэргэжилтэн хянана", "📝 Draft · expert review needed")}</p>;

/** «🧠 Та хэр мэдэх вэ?» — score at the end + one line per wrong answer. Nothing is saved anywhere. */
export default function GuardianQuizSheet({ onClose }) {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState([]);
  const done = index >= GUARDIAN_QUIZ.length;
  const card = GUARDIAN_QUIZ[index];
  const copyFor = (item) => lang === "en" ? ENGLISH_COPY[item.id] ?? [item.statement, item.explain] : [item.statement, item.explain];

  const answered = (correct) => {
    if (!correct) setWrong((list) => [...list, card]);
    setIndex((value) => value + 1);
  };

  return (
    <BottomSheet title={t("🧠 Та хэр мэдэх вэ?", "🧠 How much do you know?")} onClose={onClose}>
      <div className="space-y-4 pb-2">
        <DraftBadge />
        {done ? (
          <div className="space-y-3">
            <p className="text-center text-3xl font-black text-slate-800">{GUARDIAN_QUIZ.length - wrong.length}/{GUARDIAN_QUIZ.length}</p>
            <p className="text-center text-sm font-bold text-slate-500">{wrong.length ? t("Дараах ойлголтуудыг дахин санаарай:", "Review these topics:") : t("Гайхалтай! Бүгдийг зөв хариуллаа 🌸", "Amazing! You got everything right 🌸")}</p>
            {wrong.map((item) => (
              <p key={item.id} className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600">
                <b>“{copyFor(item)[0]}”</b> → {item.answer ? t("Үнэн", "True") : t("Худал", "False")}. {copyFor(item)[1]}
              </p>
            ))}
            <p className="text-center text-[11px] font-semibold text-slate-400">{t("Таны оноо зөвхөн танд харагдана.", "Only you can see your score.")}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setIndex(0); setWrong([]); }} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">{t("Дахин", "Try again")}</button>
              <button type="button" onClick={onClose} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">{t("Хаах", "Close")}</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-black text-slate-400">{index + 1}/{GUARDIAN_QUIZ.length}</p>
            <TrueFalseCard key={card.id} statement={copyFor(card)[0]} answer={card.answer} explain={copyFor(card)[1]} onAnswered={answered}
              nextLabel={index === GUARDIAN_QUIZ.length - 1 ? t("Үр дүн харах", "See results") : t("Дараах", "Next")} />
          </>
        )}
      </div>
    </BottomSheet>
  );
}
