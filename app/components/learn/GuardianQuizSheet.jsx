"use client";

import { useState } from "react";
import { GUARDIAN_QUIZ } from "../../../lib/guardianQuiz";
import BottomSheet from "../ui/BottomSheet";
import TrueFalseCard from "./TrueFalseCard";

const DraftBadge = () => <p className="w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">📝 Ноорог · мэргэжилтэн хянана</p>;

/** «🧠 Та хэр мэдэх вэ?» — score at the end + one line per wrong answer. Nothing is saved anywhere. */
export default function GuardianQuizSheet({ onClose }) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState([]);
  const done = index >= GUARDIAN_QUIZ.length;
  const card = GUARDIAN_QUIZ[index];

  const answered = (correct) => {
    if (!correct) setWrong((list) => [...list, card]);
    setIndex((value) => value + 1);
  };

  return (
    <BottomSheet title="🧠 Та хэр мэдэх вэ?" onClose={onClose}>
      <div className="space-y-4 pb-2">
        <DraftBadge />
        {done ? (
          <div className="space-y-3">
            <p className="text-center text-3xl font-black text-slate-800">{GUARDIAN_QUIZ.length - wrong.length}/{GUARDIAN_QUIZ.length}</p>
            <p className="text-center text-sm font-bold text-slate-500">{wrong.length ? "Дараах ойлголтуудыг дахин санаарай:" : "Гайхалтай! Бүгдийг зөв хариуллаа 🌸"}</p>
            {wrong.map((item) => (
              <p key={item.id} className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-relaxed text-slate-600">
                <b>«{item.statement}»</b> → {item.answer ? "Үнэн" : "Худал"}. {item.explain}
              </p>
            ))}
            <p className="text-center text-[11px] font-semibold text-slate-400">Таны оноо зөвхөн танд харагдана.</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setIndex(0); setWrong([]); }} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">Дахин</button>
              <button type="button" onClick={onClose} className="rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white">Хаах</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs font-black text-slate-400">{index + 1}/{GUARDIAN_QUIZ.length}</p>
            <TrueFalseCard key={card.id} statement={card.statement} answer={card.answer} explain={card.explain} onAnswered={answered}
              nextLabel={index === GUARDIAN_QUIZ.length - 1 ? "Үр дүн харах" : "Дараах"} />
          </>
        )}
      </div>
    </BottomSheet>
  );
}
