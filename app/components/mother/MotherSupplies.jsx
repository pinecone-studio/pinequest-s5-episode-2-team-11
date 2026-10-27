"use client";

import { useFamily } from "../../../context/FamilyContext";
import { Package, Check, Plus, Minus, Trash2 } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SchoolBagChecklist from "../supplies/SchoolBagChecklist";
import AddSupplyForm from "../supplies/AddSupplyForm";
import { t } from "../../../lib/i18n";

export default function MotherSupplies() {
  const { supplies, updateSupply, restock, removeSupply, daughterName } = useFamily();

  return (
    <div className="space-y-4">
      <PageHeader sub={t(`${daughterName} · хэрэгслийг хянаарай`, `${daughterName} · keep track of supplies`)} title={t("Хэрэгслийн үлдэгдэл 📦", "Supplies left 📦")} />

      {/* Хэрэгслийн үлдэгдэл */}
      <Card>
        <SectionTitle icon={Package} title={t("Ариун цэврийн хэрэгсэл", "Hygiene supplies")} />
        <div className="space-y-3">
          {Object.entries(supplies).map(([key, s]) => {
            const pct = s.count / s.max;
            const low = pct <= 0.3;
            return (
              <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                    {s.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-extrabold text-slate-700">{s.label}</span>
                      {low && (
                        <span className="shrink-0 rounded-full bb-bg-E9DDFC px-2 py-0.5 text-[10px] font-black bb-text-6A3BB8">
                          {t("Бага", "Low")}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        role="progressbar"
                        aria-label={t(`${s.label}-ийн үлдэгдэл`, `${s.label} remaining`)}
                        aria-valuemin={0}
                        aria-valuemax={s.max}
                        aria-valuenow={s.count}
                        className="h-2 flex-1 overflow-hidden rounded-full bg-white"
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, pct * 100))}%`,
                            backgroundColor: low ? "#B794F4" : "#CDB4F5",
                          }}
                        />
                      </div>
                      <span className="shrink-0 text-xs font-extrabold text-slate-500">{s.count}/{s.max}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => updateSupply(key, -1)}
                    disabled={s.count <= 0}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm active:scale-90 disabled:opacity-40"
                    aria-label={t("Хасах", "Decrease")}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => updateSupply(key, 1)}
                    disabled={s.count >= s.max}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm active:scale-90 disabled:opacity-40"
                    aria-label={t("Нэмэх", "Add")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => restock(key)}
                    disabled={s.count === s.max}
                    className="flex h-8 flex-1 items-center justify-center gap-1 rounded-xl bb-bg-E0679F px-3 text-xs font-extrabold text-white transition active:scale-95 bb-disabled-bg-FDE7F1 bb-disabled-text-B83B7E"
                  >
                    {s.count === s.max ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> {t("Дүүрсэн", "Full")}
                      </>
                    ) : (
                      t("Нөхөж дүүргэх", "Restock")
                    )}
                  </button>
                  {key.startsWith("custom_") && (
                    <button
                      type="button"
                      onClick={() => removeSupply(key)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition hover:text-rose-500"
                      aria-label={t(`${s.label} устгах`, `Delete ${s.label}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
