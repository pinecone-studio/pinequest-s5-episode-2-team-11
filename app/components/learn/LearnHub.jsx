"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Check, Backpack, Info, Apple } from "lucide-react";
import { KIT_ITEMS } from "../../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PadGuide, { usePadGuideFinished } from "./PadGuide";

export default function LearnHub() {
  const { learnTab, setLearnTab, kitChecked, toggleKit, view, setTab } =
    useFamily();
  const padDone = usePadGuideFinished();
  const isDaughter = view === "daughter";

  return (
    <div className="space-y-4 bloom-fade">
      <div>
        <p className="text-sm font-bold text-slate-400">Охид болон эцэг эхчүүдэд</p>
        <h2 className="text-2xl font-black text-slate-700">Анхны сарын тэмдэг ба боловсрол 📖</h2>
      </div>

      <div className="grid grid-cols-3 gap-1 bb-bg-FDE7F1 rounded-2xl p-1">
        {[
          ["pad", padDone ? "Хэрэглэл ✓" : "Хэрэглэл 🌸"],
          ["kit", "Сургуулийн цүнх"],
          ["food", "Хооллолт"],
        ].map(([id, label]) => (
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

      {learnTab === "pad" && <PadGuide role={view} onAskFriends={() => setTab("friends")} />}

      {learnTab === "kit" && (
        <Card>
          <SectionTitle
            icon={Backpack}
            title="ЕБС-ийн яаралтай цүнх"
            right={
              <span className="text-xs font-extrabold bb-text-B83B7E">
                {kitChecked.length}/{KIT_ITEMS.length}
              </span>
            }
          />
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-4">
            <div
              className="h-full bb-grad-8 rounded-full transition-all duration-500"
              style={{ width: `${(kitChecked.length / KIT_ITEMS.length) * 100}%` }}
            />
          </div>
          <div className="space-y-2">
            {KIT_ITEMS.map((k) => {
              const on = kitChecked.includes(k.id);
              return (
                <button
                  key={k.id}
                  onClick={() => toggleKit(k.id)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:scale-95 ${
                    on ? "bb-bg-FDE7F1" : "bb-bg-FFF7FB"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${
                      on ? "bb-bg-E0679F bb-border-E0679F" : "border-slate-300 bg-white"
                    }`}
                  >
                    {on && <Check className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-lg">{k.emoji}</span>
                  <span className={`text-sm font-bold ${on ? "bb-text-962D66" : "text-slate-600"}`}>
                    {k.label}
                  </span>
                </button>
              );
            })}
          </div>
          {kitChecked.length === KIT_ITEMS.length && (
            <p className="mt-4 text-center text-sm font-extrabold bb-text-B83B7E bb-bg-FDE7F1 rounded-2xl py-3 bloom-pop">
              🎉 Цүнх бэлэн боллоо — чи юунд ч бэлэн!
            </p>
          )}
        </Card>
      )}


      {learnTab === "food" && (
        <Card>
          <SectionTitle icon={Apple} title="Сарын тэмдэг ирсэн үед юу идэх вэ?" />
          <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-600">
            Дуртай хоолоо идэж болно шүү. Хоолыг бүр мөсөн хорих хэрэггүй 🌸
          </p>
          <div className="space-y-3">
            <div className="rounded-2xl bb-bg-FFF7FB p-4">
              <p className="font-extrabold bb-text-962D66">Тэжээлтэй хоол сонгоорой 🌿</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Овьёос, талх, будаа, тараг, өндөг, мах, жимс ногоо гээд дуртай тэжээлтэй хоолоо сонгоорой. Бүлээн ус уухаа мартав аа, хөөрхнөө 🌸
              </p>
            </div>
            <div className="rounded-2xl bb-bg-FFF7FB p-4">
              <p className="font-extrabold bb-text-962D66">Амттан идмээр санагдвал 🍫</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Амттан идмээр байвал жимс, тарагтай овьёос эсвэл жаахан шоколад идэж болно. Амттанаа бүр мөсөн хорих хэрэггүй шүү 🍫
              </p>
            </div>
            <div className="rounded-2xl bb-bg-FFF7FB p-4">
              <p className="font-extrabold bb-text-962D66">Биеэ сонсоорой 💗</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Чипс, кофе эсвэл өтгөн цай заримдаа гэдсийг эвгүйрхүүлдэг. Чамд тэгж санагдвал бага хэрэглээд үзээрэй. Өөртөө юу таатайг анзаараарай 💗
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium leading-relaxed text-slate-400">
            Гэдэс базалсан өдөр өөртөө жаахан амралт өгөөрэй. Бүлээн ус ууж, бүлээн жин тавиад биеэ амраагаарай. Жингээ хэт халуун байлгаж болохгүй шүү 💗
          </p>
        </Card>
      )}
      <div className="flex items-start gap-3 rounded-2xl bb-bg-E9DDFC-30 p-4">
        <Info className="w-5 h-5 bb-text-7C4DCC shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
          Энэ аппын мэдээлэл эмчийн зөвлөгөөг орлохгүй. Их өвдөх, цус их гарах зэрэг санаа зовоосон зүйл
          байвал ээждээ болон итгэдэг том хүндээ хандаарай. Шаардлагатай бол эмчид хандаарай.
        </p>
      </div>
    </div>
  );
}
