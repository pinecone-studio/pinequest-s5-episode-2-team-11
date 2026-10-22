"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Package, ChevronRight, Backpack, Send } from "lucide-react";
import { KIT_ITEMS } from "../../../lib/data";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";

export default function DaughterSupplies() {
  const { linked, setTab, setLearnTab, supplies, kitChecked, updateSupply, requestSupplies } = useFamily();

  return (
    <div className="space-y-4">
      <PageHeader sub="Дуусахаас нь өмнө ээждээ хэлээрэй" title="Миний хэрэгсэл 🎒" />

      {/* Хэрэгсэл */}
      <Card>
        <SectionTitle icon={Package} title="Үлдэгдэл" />
        <div className="space-y-2.5">
          {Object.entries(supplies).map(([key, s]) => {
            const pct = s.count / s.max;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-lg w-6 text-center">{s.emoji}</span>
                <span className="w-24 text-sm font-bold text-slate-600">{s.label}</span>
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
          {linked ? "Дуусах дөхсөн үү? Ээждээ хэлэх" : "Хүсэлт илгээхийн тулд ээжтэйгээ холбогдоорой"}
        </button>
      </Card>

      <button
        onClick={() => {
          setLearnTab("kit");
          setTab("learn");
        }}
        className="w-full flex items-center gap-3 bg-white rounded-3xl p-4 border border-slate-100 shadow-sm active:scale-95 transition text-left"
      >
        <span className="w-10 h-10 rounded-xl bb-bg-FDE7F1 flex items-center justify-center">
          <Backpack className="w-5 h-5 bb-text-B83B7E" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-extrabold text-slate-700">Сургуулийн яаралтай цүнх</span>
          <span className="block text-xs font-semibold text-slate-500">
            {kitChecked.length}/{KIT_ITEMS.length} зүйл бэлэн
          </span>
        </span>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </button>
    </div>
  );
}
