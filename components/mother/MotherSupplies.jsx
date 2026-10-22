"use client";

import { useFamily } from "../../context/FamilyContext";
import { Package, Check, Plus, Minus } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";

export default function MotherSupplies() {
  const { supplies, updateSupply, restock } = useFamily();

  return (
    <div className="space-y-4">
      <PageHeader sub="Охиныхоо хэрэгслийг хянаарай" title="Хэрэгслийн үлдэгдэл 📦" />

      {/* Хэрэгслийн үлдэгдэл */}
      <Card>
        <SectionTitle icon={Package} title="Ариун цэврийн хэрэгсэл" />
        <div className="space-y-5">
          {Object.entries(supplies).map(([key, s]) => {
            const pct = s.count / s.max;
            const low = pct <= 0.3;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-extrabold text-slate-700 text-sm">
                    <span className="text-lg">{s.emoji}</span> {s.label}
                    {low && (
                      <span className="text-xs font-black bb-bg-FFD8CC bb-text-B4553C rounded-full px-2 py-0.5">
                        Дуусах дөхсөн
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-extrabold text-slate-400">
                    {s.count} / {s.max}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {Array.from({ length: s.max }).map((_, i) => (
                    <span
                      key={i}
                      className="h-5 flex-1 rounded-md transition-all duration-300"
                      style={{
                        minWidth: 8,
                        maxWidth: 22,
                        background: i < s.count ? (low ? "#F2A68F" : "#A5D6A7") : "#F1F5F9",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSupply(key, -1)}
                    className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-90"
                    aria-label="Хасах"
                  >
                    <Minus className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => updateSupply(key, 1)}
                    className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-90"
                    aria-label="Нэмэх"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => restock(key)}
                    disabled={s.count === s.max}
                    className="flex-1 h-9 rounded-xl bb-bg-5E9E64 bb-disabled-bg-E8F5E9 bb-disabled-text-4F8A55 text-white text-xs font-extrabold active:scale-95 transition flex items-center justify-center gap-1"
                  >
                    {s.count === s.max ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Дүүрэн
                      </>
                    ) : (
                      "Нөхөн дүүргэсэн"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
