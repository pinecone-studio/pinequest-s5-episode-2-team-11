"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Package, Check, Plus, Minus } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SchoolBagChecklist from "../supplies/SchoolBagChecklist";
import AddSupplyForm from "../supplies/AddSupplyForm";

export default function MotherSupplies() {
  const { supplies, updateSupply, restock, removeSupply, daughterName } = useFamily();

  return (
    <div className="space-y-4">
      <PageHeader sub={`${daughterName} · хэрэгслийг хянаарай`} title="Хэрэгслийн үлдэгдэл 📦" />

      {/* Хэрэгслийн үлдэгдэл */}
      <Card>
        <SectionTitle icon={Package} title="Ариун цэврийн хэрэгсэл" />
        <div className="space-y-2.5">
          {Object.entries(supplies).map(([key, s]) => {
            const pct = s.count / s.max;
            const low = pct <= 0.3;
            return (
              <div key={key} className="rounded-2xl bg-[#FFF7FB] px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xl" aria-hidden="true">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-extrabold leading-tight text-slate-700">{s.label}</span>
                      {low && <span className="rounded-full bb-bg-E9DDFC px-2 py-0.5 text-[10px] font-black leading-tight bb-text-6A3BB8">Дуусах дөхсөн</span>}
                    </div>
                    {key.startsWith("custom_") && <button type="button" onClick={() => removeSupply(key)} className="mt-0.5 text-[11px] font-bold text-slate-400 hover:text-rose-500">Устгах</button>}
                  </div>
                  <span className="shrink-0 text-xs font-extrabold text-slate-500">{s.count}<span className="font-semibold text-slate-400"> / {s.max}</span></span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`${s.label} үлдэгдэл`}
                  aria-valuemin={0}
                  aria-valuemax={s.max}
                  aria-valuenow={s.count}
                >
                  <div className={`h-full rounded-full transition-all ${low ? "bg-violet-300" : "bg-pink-400"}`} style={{ width: `${Math.min(100, pct * 100)}%` }} />
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    onClick={() => updateSupply(key, -1)}
                    disabled={s.count <= 0}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 active:scale-90 disabled:opacity-40"
                    aria-label={`${s.label}-ээс нэгийг хасах`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateSupply(key, 1)}
                    disabled={s.count >= s.max}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 active:scale-90 disabled:opacity-40"
                    aria-label={`${s.label}-д нэгийг нэмэх`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => restock(key)}
                    disabled={s.count === s.max}
                    className="flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bb-bg-E0679F bb-disabled-bg-FDE7F1 bb-disabled-text-B83B7E text-xs font-extrabold text-white transition active:scale-95"
                  >
                    {s.count === s.max ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Дүүрэн
                      </>
                    ) : (
                      "Нөхөн дүүргэх"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <AddSupplyForm />
      </Card>

      <SchoolBagChecklist />
    </div>
  );
}
