"use client";

import { useEffect } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { Info, Apple } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PadGuide, { usePadGuideFinished } from "./PadGuide";

export default function LearnHub() {
  const { learnTab, setLearnTab, view, setTab } =
    useFamily();
  const padDone = usePadGuideFinished();
  const isDaughter = view === "daughter";
  useEffect(() => {
    if (isDaughter && learnTab === "kit") setLearnTab("pad");
  }, [isDaughter, learnTab, setLearnTab]);
  const tabs = [
    ...(isDaughter ? [["pad", padDone ? "Хэрэглэл ✓" : "Хэрэглэл 🌸"]] : []),
    ...(isDaughter ? [["food", "Хооллолт"]] : []),
  ];

  return (
    <div className="space-y-4 bloom-fade">
      <div className="grid grid-cols-2 gap-1 bb-bg-FDE7F1 rounded-2xl p-1">
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

      {isDaughter && learnTab === "pad" && <PadGuide role={view} onAskFriends={() => setTab("friends")} />}

      {isDaughter && learnTab === "food" && (
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
      {isDaughter && (
        <div className="flex items-start gap-3 rounded-2xl bb-bg-E9DDFC-30 p-4">
          <Info className="w-5 h-5 bb-text-7C4DCC shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            Энэ аппын мэдээлэл эмчийн зөвлөгөөг орлохгүй. Их өвдөх, цус их гарах зэрэг санаа зовоосон зүйл
            байвал ээждээ болон итгэдэг том хүндээ хандаарай. Шаардлагатай бол эмчид хандаарай.
          </p>
        </div>
      )}
    </div>
  );
}
