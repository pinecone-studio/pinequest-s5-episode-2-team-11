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
        <p className="text-sm font-bold text-slate-400">
          {view === "mother" ? "Асран хамгаалагчдад" : "Охидод"}
        </p>
        <h2 className="text-2xl font-black text-slate-700">Анхны сарын тэмдэг ба боловсрол 📖</h2>
      </div>

      <div className="grid grid-cols-3 gap-1 bb-bg-FDE7F1 rounded-2xl p-1">
        {[
          ...(isDaughter ? [["pad", padDone ? "Пад заавар ✓" : "Пад заавар 🌸"],] : []),
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

      {isDaughter && learnTab === "pad" && <PadGuide role={view} onAskFriends={() => setTab("friends")} />}

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
          <p className="mt-3 text-xs font-semibold text-slate-400 text-center">
            Энэ жагсаалт ээж, охин хоёрын харагдацад зэрэг шинэчлэгдэнэ.
          </p>
        </Card>
      )}


      {learnTab === "food" && (
        <Card>
          <SectionTitle icon={Apple} title="Сарын тэмдгийн үеийн хооллолт" />
          <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-600">
            Заавал хориглох хүнс байхгүй. Өөрт таатай, тэнцвэртэй хоол сонгоорой.
          </p>
          <div className="space-y-3">
            <div className="rounded-2xl bb-bg-FFF7FB p-4">
              <p className="font-extrabold bb-text-962D66">Идвэл тохиромжтой санаанууд 🌿</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Овьёос, бүхэл үрийн талх, будаа; тараг, навчит ногоо; өндөг, шош, мах зэрэг төмөртэй хүнс; жимс, ногоо, ус.
              </p>
            </div>
            <div className="rounded-2xl bb-bg-FFF7FB p-4">
              <p className="font-extrabold bb-text-962D66">Амттан идмээр санагдвал 🍫</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Жимс, тарагтай овьёос эсвэл багахан шоколад идэж болно. Амттаныг бүрэн хорих шаардлагагүй.
              </p>
            </div>
            <div className="rounded-2xl bb-bg-FFF7FB p-4">
              <p className="font-extrabold bb-text-962D66">Биеэ ажиглаарай 💧</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Давс ихтэй зууш, кофеин зарим хүнд зовиур нэмэгдүүлж болно. Тийм бол хэмжээг нь багасгаад үзээрэй; хүнс бүрийг хорих шаардлагагүй.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium leading-relaxed text-slate-400">
            Тэнцвэртэй хооллолт, кальци агуулсан хүнсийг зөвлөдөг. Хоол хүнс нь сарын тэмдгийн өвдөлтийг заавал арилгана гэсэн үг биш.
            <a className="ml-1 underline" href="https://www.acog.org/womens-health/faqs/premenstrual-syndrome" target="_blank" rel="noreferrer">ACOG-ийн зөвлөмж</a>
          </p>
        </Card>
      )}
      <div className="flex items-start gap-3 rounded-2xl bb-bg-E9DDFC-30 p-4">
        <Info className="w-5 h-5 bb-text-7C4DCC shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
          Энэ апп эмчийн зөвлөгөөг орлохгүй. Хүчтэй өвдөлт, хэт их цус алдалт эсвэл санаа зовох зүйл байвал
          эмчдээ хандаарай.
        </p>
      </div>
    </div>
  );
}
