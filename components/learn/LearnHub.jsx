"use client";

import { useFamily } from "../../context/FamilyContext";
import { Check, Backpack, Info, RefreshCw } from "lucide-react";
import { KIT_ITEMS, MYTHS } from "../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";

export default function LearnHub() {
  const { learnTab, setLearnTab, kitChecked, flippedMyths, toggleKit, toggleMyth } = useFamily();

  return (
    <div className="space-y-4 bloom-fade">
      <div>
        <p className="text-sm font-bold text-slate-400">Охид болон эцэг эхчүүдэд</p>
        <h2 className="text-2xl font-black text-slate-700">Анхны сарын тэмдэг ба боловсрол 📖</h2>
      </div>

      <div className="grid grid-cols-2 gap-1 bb-bg-E8F5E9 rounded-2xl p-1">
        {[
          ["kit", "Сургуулийн цүнх"],
          ["myths", "Домог ба үнэн"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setLearnTab(id)}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
              learnTab === id ? "bg-white bb-text-4F8A55 shadow-sm" : "text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {learnTab === "kit" && (
        <Card>
          <SectionTitle
            icon={Backpack}
            title="ЕБС-ийн яаралтай цүнх"
            right={
              <span className="text-xs font-extrabold bb-text-4F8A55">
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
                    on ? "bb-bg-E8F5E9" : "bb-bg-FAF8F5"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${
                      on ? "bb-bg-5E9E64 bb-border-5E9E64" : "border-slate-300 bg-white"
                    }`}
                  >
                    {on && <Check className="w-4 h-4 text-white" />}
                  </span>
                  <span className="text-lg">{k.emoji}</span>
                  <span className={`text-sm font-bold ${on ? "bb-text-3F7445" : "text-slate-600"}`}>
                    {k.label}
                  </span>
                </button>
              );
            })}
          </div>
          {kitChecked.length === KIT_ITEMS.length && (
            <p className="mt-4 text-center text-sm font-extrabold bb-text-4F8A55 bb-bg-E8F5E9 rounded-2xl py-3 bloom-pop">
              🎉 Цүнх бэлэн боллоо — чи юунд ч бэлэн!
            </p>
          )}
          <p className="mt-3 text-xs font-semibold text-slate-400 text-center">
            Энэ жагсаалт ээж, охин хоёрын харагдацад зэрэг шинэчлэгдэнэ.
          </p>
        </Card>
      )}

      {learnTab === "myths" && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 text-center">Карт дээр дарж үнэнийг мэдээрэй ✨</p>
          {MYTHS.map((m) => {
            const flipped = flippedMyths.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleMyth(m.id)}
                className={`w-full text-left rounded-3xl p-5 transition-all duration-300 active:scale-95 border-2 ${
                  flipped ? "bb-bg-E8F5E9 bb-border-C8E6C9" : "bg-white border-slate-100 shadow-sm"
                }`}
              >
                <span
                  className={`inline-block text-xs font-black uppercase tracking-widest rounded-full px-2.5 py-1 ${
                    flipped ? "bb-bg-5E9E64 text-white" : "bb-bg-FFD8CC bb-text-B4553C"
                  }`}
                >
                  {flipped ? "✓ Үнэн" : "✗ Домог"}
                </span>
                <p
                  key={flipped ? "fact" : "myth"}
                  className={`mt-2 font-extrabold leading-snug bloom-pop ${flipped ? "bb-text-3F7445" : "text-slate-700"}`}
                >
                  {flipped ? m.fact : `«${m.myth}»`}
                </p>
                {!flipped && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                    <RefreshCw className="w-3 h-3" /> Эргүүлэх
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl bb-bg-FFD8CC-30 p-4">
        <Info className="w-5 h-5 bb-text-C2674F shrink-0 mt-0.5" />
        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
          Энэ апп эмчийн зөвлөгөөг орлохгүй. Хүчтэй өвдөлт, хэт их цус алдалт эсвэл санаа зовох зүйл байвал
          эмчдээ хандаарай.
        </p>
      </div>
    </div>
  );
}
