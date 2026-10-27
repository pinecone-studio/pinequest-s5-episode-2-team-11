"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Package, Send, Trash2 } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SchoolBagChecklist from "../supplies/SchoolBagChecklist";
import AddSupplyForm from "../supplies/AddSupplyForm";

export default function DaughterSupplies({ embedded = false }) {
  const { linked, supplies, updateSupply, requestSupplies, removeSupply } = useFamily();

  return (
    <div className="space-y-4">
      {!embedded && <PageHeader sub="Дуусахаас нь өмнө асран хамгаалагчдаа хэлээрэй" title="Миний хэрэгсэл 🎒" />}

      {/* Хэрэгсэл */}
      <Card>
        <SectionTitle icon={Package} title="Үлдэгдэл" />
        <div className="space-y-2.5">
          {Object.entries(supplies).map(([key, s]) => {
            const pct = s.count / s.max;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bb-bg-FFF7FB text-lg">
                  {s.emoji}
                  {(key === "day" || key === "night") && <span className={`absolute -right-1.5 -top-1 rounded-full px-1 py-0.5 text-[8px] font-black leading-none text-white ${key === "day" ? "bb-bg-E0679F" : "bb-bg-B794F4"}`}>{s.count}ш</span>}
                </span>
                <span className="w-24 shrink-0 text-sm font-bold text-slate-600">{s.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct * 100}%`,
                      background: pct <= 0.3 ? "#B794F4" : pct <= 0.6 ? "#D8C4F7" : "#F48FB1",
                    }}
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-500 w-6 text-right">{s.count}</span>
                <button
                  onClick={() => updateSupply(key, -1)}
                  className="text-xs font-extrabold text-slate-400 bb-hover-text-7C4DCC px-1"
                  title="Нэгийг хэрэглэсэн"
                >
                  −1
                </button>
                {key.startsWith("custom_") && <button onClick={() => removeSupply(key)} className="p-1 text-slate-300 hover:text-rose-500" aria-label={`${s.label} устгах`}><Trash2 className="h-4 w-4" /></button>}
              </div>
            );
          })}
        </div>
        <button
          onClick={requestSupplies}
          disabled={!linked}
          className="mt-4 w-full rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E disabled:text-slate-300 disabled:bg-slate-50 font-extrabold py-3 text-sm active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />{" "}
          {linked ? "Дуусах дөхсөн үү? Асран хамгаалагчдаа хэлэх" : "Хүсэлт илгээхийн тулд асран хамгаалагчтайгаа холбогдоорой"}
        </button>
        <AddSupplyForm />
      </Card>

      <SchoolBagChecklist daughter />
    </div>
  );
}
