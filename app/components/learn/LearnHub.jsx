"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import {
  Apple,
  ChevronRight,
  Droplets,
  Heart,
  Leaf,
  Sparkles,
  X,
} from "lucide-react";
import PadGuide, { usePadGuideFinished } from "./PadGuide";
import ParentAiAssistant from "./ParentAiAssistant";
import ParentLearningTopics from "./ParentLearningTopics";

export default function LearnHub() {
  const [selectedFoodTip, setSelectedFoodTip] = useState(null);
  const { learnTab, setLearnTab, view, setTab } =
    useFamily();
  const padDone = usePadGuideFinished();
  const isDaughter = view === "daughter";
  const SelectedFoodIcon = selectedFoodTip?.icon;
  useEffect(() => {
    if (isDaughter && learnTab === "kit") setLearnTab("pad");
  }, [isDaughter, learnTab, setLearnTab]);
  useEffect(() => {
    if (!selectedFoodTip) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedFoodTip(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedFoodTip]);
  const tabs = [
    ...(isDaughter ? [["pad", padDone ? "Хэрэглэл ✓" : "Хэрэглэл 🌸"]] : []),
    ...(isDaughter ? [["food", "Хооллолт"]] : []),
  ];
  const compactLesson = isDaughter && learnTab === "pad";
  const foodTips = [
    {
      icon: Leaf,
      number: "01",
      title: "Тэжээлтэй хоол сонгоорой",
      description:
        "Овьёос, талх, будаа, тараг, өндөг, мах, жимс ногооноос өөрт тохирох тэжээллэг хоолоо сонгоорой. Заавал тусгай хоол идэх албагүй, өөрт таалагддаг зүйлээсээ сонгож болно 🌸",
      color: "text-[#4F8B67]",
      iconBg: "bg-[#E6F4E9]",
      line: "bg-[#B8DFC2]",
      tone: "leaf",
    },
    {
      icon: Droplets,
      number: "02",
      title: "Бүлээн ус уугаарай",
      description:
        "Өдөртөө ус уухаа мартав аа. Бүлээн ус уухад таатай байвал ойр ойрхон бага багаар уугаарай. Заавал халуун байх шаардлагагүй шүү 💧",
      color: "text-[#8052C6]",
      iconBg: "bb-bg-E9DDFC-60",
      line: "bg-[#CDB7F5]",
      tone: "water",
    },
    {
      icon: Apple,
      number: "03",
      title: "Амттан идмээр санагдвал",
      description:
        "Амттан идмээр байвал жимс, тарагтай овьёос эсвэл жаахан шоколад идэж болно. Амттанаа бүр мөсөн хорих хэрэггүй шүү 🍫",
      color: "bb-text-B83B7E",
      iconBg: "bb-bg-FDE7F1",
      line: "bg-[#F3B6D1]",
      tone: "sweet",
    },
    {
      icon: Heart,
      number: "04",
      title: "Зайлсхийх зүйлс",
      description:
        "Зовиуртай үед эдгээрийг багасгаарай:\n\n• Кофе, өтгөн цай, энергийн ундаа — нойр муутгаж, базлалтыг нэмэгдүүлж магадгүй.\n• Давс ихтэй чипс, түргэн хоол — гэдэс дүүргэж магадгүй.\n• Их чихэр — сарын тэмдгийн өмнөх зовиурыг нэмэгдүүлж магадгүй.\n\nХүн бүрт нөлөө нь өөр 💗",
      color: "learn-food-avoid-fg",
      iconBg: "learn-food-avoid-icon",
      line: "bg-[#E9B45A]",
      tone: "avoid",
    },
  ];

  return (
    <div className={compactLesson ? "flex h-full min-h-0 flex-col overflow-hidden" : "space-y-4 bloom-fade"}>
      {isDaughter && (
        <div className={`grid grid-cols-2 gap-1 rounded-2xl bb-bg-FDE7F1 p-1 ${compactLesson ? "mb-2 flex-none" : ""}`}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setLearnTab(id)}
              className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
                learnTab === id ? "bg-white bb-text-B83B7E shadow-sm" : "text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isDaughter && learnTab === "pad" && (
        <PadGuide role={view} onAskFriends={() => setTab("friends")} />
      )}
      {!isDaughter && (
        <>
          <ParentAiAssistant />
          <ParentLearningTopics />
        </>
      )}

      {isDaughter && learnTab === "food" && (
        <div className="space-y-4">
          <section className="learn-food-hero relative isolate overflow-hidden rounded-[1.75rem] border border-pink-100 bg-gradient-to-br from-[#FFE6F1] via-[#FFF4F8] to-[#F0E9FF] p-4 shadow-sm sm:p-5">
            <div aria-hidden="true" className="learn-food-hero-orb absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full bg-white/55" />
            <div aria-hidden="true" className="learn-food-hero-orb absolute -bottom-16 right-20 -z-10 h-28 w-28 rounded-full bg-[#F8D6E8]/60" />
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-xl">
                <span className="learn-food-hero-badge inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[9px] font-black tracking-[0.12em] text-[#A74E80]">
                  <Sparkles className="h-3 w-3" /> ӨӨРИЙГӨӨ ХАЛАМЖЛАХ НЬ
                </span>
                <h2 className="mt-3 text-xl font-black leading-tight text-slate-800 sm:text-2xl">
                  Сарын тэмдгийн үед юу идвэл дээр вэ?
                </h2>
              </div>
              <div className="learn-food-hero-icon hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-white/80 shadow-sm sm:flex">
                <Apple className="h-6 w-6 text-[#C44886]" strokeWidth={1.8} />
              </div>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            {foodTips.map(({ icon: Icon, number, title, description, color, iconBg, line, tone }) => (
              <button
                key={number}
                type="button"
                onClick={() => setSelectedFoodTip({ icon: Icon, number, title, description, color, iconBg, tone })}
                aria-haspopup="dialog"
                aria-label={`${title} — дэлгэрэнгүй унших`}
                data-tone={tone}
                className="learn-food-tip-card group relative w-full overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 sm:p-6"
              >
                <div aria-hidden="true" className={`absolute inset-y-5 left-0 w-1 rounded-r-full ${line}`} />
                <div className="flex items-start gap-3.5">
                  <span className={`learn-food-tip-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
                    <Icon className={`learn-food-tip-icon-svg h-5 w-5 ${color}`} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black leading-snug text-slate-800 sm:text-lg">{title}</h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-[#A74E80]">
                      Дэлгэрэнгүй <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>
      )}
      {isDaughter && selectedFoodTip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
          <button
            type="button"
            aria-label="Попап хаах"
            onClick={() => setSelectedFoodTip(null)}
            className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-tip-title"
            aria-describedby="food-tip-description"
            data-tone={selectedFoodTip.tone}
            className="relative z-10 my-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl bloom-pop sm:p-8"
          >
            <div aria-hidden="true" className="learn-food-dialog-orb absolute -right-10 -top-12 h-36 w-36 rounded-full bg-pink-100/70" />
            <button
              type="button"
              autoFocus
              onClick={() => setSelectedFoodTip(null)}
              aria-label="Хаах"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-pink-100 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className={`learn-food-tip-icon flex h-14 w-14 items-center justify-center rounded-[1.25rem] ${selectedFoodTip.iconBg}`}>
                  <SelectedFoodIcon className={`learn-food-tip-icon-svg h-7 w-7 ${selectedFoodTip.color}`} strokeWidth={1.9} />
                </span>
              </div>
              <h2 id="food-tip-title" className="mt-5 pr-8 text-2xl font-black leading-tight text-slate-800">
                {selectedFoodTip.title}
              </h2>
              <p id="food-tip-description" className="mt-4 whitespace-pre-line text-base font-semibold leading-relaxed text-slate-600">
                {selectedFoodTip.description}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
