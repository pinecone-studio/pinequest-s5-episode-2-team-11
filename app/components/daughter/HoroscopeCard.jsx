"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { zodiacFromBirthDate } from "../../../lib/zodiac";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";

/** Төрсөн өдрөөр нь ордыг олж, gogo.mn-ийн өнөөдрийн зурхайг харуулна. */
export default function HoroscopeCard() {
  const { birthDate } = useFamily();
  const sign = zodiacFromBirthDate(birthDate);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState({ status: "idle", text: "" });

  // Зурхайг «Харах» дарахад л татна
  useEffect(() => {
    if (!sign || !open) return;
    let cancelled = false;
    setResult({ status: "loading", text: "" });
    fetch(`/api/horoscope?sign=${encodeURIComponent(sign.name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && setResult({ status: "done", text: d.text }))
      .catch(() => !cancelled && setResult({ status: "error", text: "" }));
    return () => {
      cancelled = true;
    };
  }, [sign?.name, open]);

  if (!sign) {
    return (
      <Card className="horoscope-card bg-gradient-to-br from-white via-white to-[#fbf7ff] border-purple-100 ring-1 ring-purple-100/70 shadow-[0_12px_28px_rgba(124,77,204,0.14)]">
        <SectionTitle icon={Sparkles} title="Өнөөдрийн зурхай" tone="peach" />
        <p className="text-sm font-semibold text-slate-500">
          Төрсөн өдрийн мэдээлэл бүртгэлд байхгүй тул зурхайг харуулах боломжгүй байна.
        </p>
      </Card>
    );
  }

  return (
    <Card className="horoscope-card bg-gradient-to-br from-white via-white to-[#fbf7ff] border-purple-100 ring-1 ring-purple-100/70 shadow-[0_12px_28px_rgba(124,77,204,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(124,77,204,0.2)]">
      <SectionTitle icon={Sparkles} title="Өнөөдрийн зурхай" tone="peach" />
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bb-bg-E9DDFC-50 flex items-center justify-center text-2xl bb-text-7C4DCC">
          {sign.emoji}
        </span>
        <div className="flex-1">
          <p className="font-black text-slate-700">{sign.name}</p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Өнөөдрийн зурхайг хаах" : "Өнөөдрийн зурхайг харах"}
          className="w-10 h-10 flex items-center justify-center rounded-full bb-bg-E9DDFC-50 bb-text-7C4DCC shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
          <div className="mt-4 rounded-2xl bb-bg-E9DDFC-50 p-4 text-sm font-semibold text-slate-600 leading-relaxed bloom-fade">
            {result.status === "loading" && (
              <span className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Уншиж байна…
              </span>
            )}
            {result.status === "done" && <p>{result.text}</p>}
            {result.status === "error" && (
              <p className="text-slate-400">Өнөөдрийн зурхайг ачаалж чадсангүй. Дараа дахин үзээрэй.</p>
            )}
          </div>
      )}
    </Card>
  );
}
