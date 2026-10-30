"use client";

import { useRouter } from "next/navigation";
import { useFamily } from "../../../context/FamilyContext";
import { Link2, Package, Check, Plus, Minus, RefreshCw, Trash2 } from "lucide-react";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";
import SchoolBagChecklist from "../supplies/SchoolBagChecklist";
import AddSupplyForm from "../supplies/AddSupplyForm";
import { t } from "../../../lib/i18n";

// Хэрэглэл бүрийн өнгө (цайвар, бараан горимд хоёуланд нь уншигдана)
const SUPPLY_ACCENTS = { day: "#E0679F", night: "#8B5CF6", liner: "#2E9E74" };
const EXTRA_ACCENTS = ["#D08712", "#2D8FC7", "#D9604F"];

export default function MotherSupplies() {
  const { supplies, updateSupply, restock, removeSupply, daughterName, linked } = useFamily();
  const router = useRouter();

  // Охинтой холбогдоогүй үед хэрэглэл, цүнхний жагсаалтыг харуулахгүй
  if (!linked) {
    return (
      <div className="space-y-4">
        <PageHeader sub={t("Охины хэрэгслийг хянах", "Track your daughter's supplies")} title={t("Хэрэгслийн үлдэгдэл 📦", "Supplies left 📦")} />
        <Card className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E">
            <Link2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-3 text-base font-black text-slate-700">{t("Эхлээд охинтойгоо холбогдоорой", "Connect with your daughter first")}</p>
          <p className="mx-auto mt-1 max-w-xs text-sm font-semibold leading-relaxed text-slate-500">
            {t(
              "Холбогдсоны дараа охины хэрэглэлийн үлдэгдэл, сургуулийн цүнхний жагсаалт энд харагдана 🌱",
              "Once connected, your daughter's supplies and school bag checklist will show up here 🌱",
            )}
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mt-4 w-full rounded-2xl bb-grad-sos py-3 text-sm font-extrabold text-white transition active:scale-95"
          >
            {t("Гэр бүлийн код авах", "Get the family code")}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader sub={t(`${daughterName} · хэрэгслийг хянаарай`, `${daughterName} · keep track of supplies`)} title={t("Хэрэгслийн үлдэгдэл 📦", "Supplies left 📦")} />

      {/* Хэрэгслийн үлдэгдэл */}
      <Card>
        <SectionTitle icon={Package} title={t("Ариун цэврийн хэрэгсэл", "Hygiene supplies")} />
        <div className="space-y-3">
          {Object.entries(supplies).map(([key, s], index) => {
            const pct = s.max ? s.count / s.max : 0;
            const empty = s.count <= 0;
            const low = pct <= 0.3;
            const full = s.count >= s.max;
            const accent = SUPPLY_ACCENTS[key] ?? EXTRA_ACCENTS[index % EXTRA_ACCENTS.length];
            const status = empty
              ? { text: t("Дууссан", "Out"), cls: "bg-rose-500 text-white" }
              : low
                ? { text: t("Бага үлдсэн", "Running low"), cls: "bg-rose-100 text-rose-700" }
                : { text: t("Хангалттай", "Enough"), cls: "bg-emerald-100 text-emerald-700" };
            return (
              <div key={key} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ backgroundColor: `${accent}26` }}
                    aria-hidden="true"
                  >
                    {s.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-700">{s.label}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${status.cls}`}>{status.text}</span>
                  </div>
                  <p className="shrink-0 text-right leading-none">
                    <span className="text-2xl font-black" style={{ color: accent }}>{s.count}</span>
                    <span className="text-xs font-extrabold text-slate-400">/{s.max}</span>
                  </p>
                </div>

                <div
                  role="progressbar"
                  aria-label={t(`${s.label}-ийн үлдэгдэл`, `${s.label} remaining`)}
                  aria-valuemin={0}
                  aria-valuemax={s.max}
                  aria-valuenow={s.count}
                  className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%`, backgroundColor: accent }}
                  />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex shrink-0 items-center rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => updateSupply(key, -1)}
                      disabled={empty}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition active:scale-90 disabled:opacity-30"
                      aria-label={t(`${s.label} хасах`, `Decrease ${s.label}`)}
                    >
                      <Minus className="h-4 w-4" strokeWidth={2.6} />
                    </button>
                    <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => updateSupply(key, 1)}
                      disabled={full}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition active:scale-90 disabled:opacity-30"
                      aria-label={t(`${s.label} нэмэх`, `Increase ${s.label}`)}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.6} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => restock(key)}
                    disabled={full}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-extrabold transition active:scale-95 disabled:cursor-default"
                    style={
                      full
                        ? { backgroundColor: `${accent}1F`, color: accent }
                        : low
                          ? { backgroundColor: accent, color: "#FFFFFF", boxShadow: `0 6px 14px -8px ${accent}` }
                          : { backgroundColor: "transparent", color: accent, border: `2px solid ${accent}` }
                    }
                  >
                    {full ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={3} /> {t("Дүүрсэн", "Full")}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.6} /> {t("Нөхөж дүүргэх", "Restock")}
                      </>
                    )}
                  </button>
                  {key.startsWith("custom_") && (
                    <button
                      type="button"
                      onClick={() => removeSupply(key)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition hover:text-rose-500"
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
