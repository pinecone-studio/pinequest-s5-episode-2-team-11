"use client";

import { useEffect, useState } from "react";
import { Sparkles, Pencil, Loader2, ChevronDown } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { zodiacFromBirthDate } from "../../../lib/zodiac";
import { toDateStr } from "../../../lib/dates";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";

/** Төрсөн өдрөөр нь ордыг олж, gogo.mn-ийн өнөөдрийн зурхайг харуулна. */
export default function HoroscopeCard() {
  const { birthDate, saveBirthDate } = useFamily();
  const sign = zodiacFromBirthDate(birthDate);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(birthDate ?? "");
  const [busy, setBusy] = useState(false);
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

  const save = async (e) => {
    e.preventDefault();
    if (!input) return;
    setBusy(true);
    const ok = await saveBirthDate(input);
    setBusy(false);
    if (ok) setEditing(false);
  };

  if (!sign || editing) {
    return (
      <Card>
        <SectionTitle icon={Sparkles} title="Өнөөдрийн зурхай" tone="peach" />
        <p className="text-sm font-semibold text-slate-500">
          Төрсөн өдрөө оруулаарай — ордыг чинь автоматаар олоод өдөр бүрийн зурхайг харуулна ✨
        </p>
        <form onSubmit={save} className="mt-3 flex gap-2">
          <input
            id="birth-date"
            type="date"
            value={input}
            max={toDateStr()}
            min="1950-01-01"
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 min-w-0 rounded-2xl border-2 border-slate-100 bb-focus-border-F48FB1 outline-none px-4 py-2.5 font-bold text-slate-700 bg-white"
            aria-label="Төрсөн өдөр"
          />
          <button
            disabled={!input || busy}
            className="px-4 rounded-2xl bb-bg-E0679F bb-disabled-bg-F8D3E6 text-white font-extrabold text-sm flex items-center gap-1"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Хадгалах
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle
        icon={Sparkles}
        title="Өнөөдрийн зурхай"
        tone="peach"
        right={
          <button
            onClick={() => {
              setInput(birthDate ?? "");
              setEditing(true);
            }}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Төрсөн өдөр засах"
          >
            <Pencil className="w-4 h-4" />
          </button>
        }
      />
      <div className="flex items-center gap-3">
        <span className="w-12 h-12 rounded-2xl bb-bg-E9DDFC-50 flex items-center justify-center text-2xl bb-text-7C4DCC">
          {sign.emoji}
        </span>
        <div>
          <p className="font-black text-slate-700">{sign.name}</p>
          <p className="text-xs font-semibold text-slate-400">{sign.range}</p>
        </div>
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm font-extrabold bb-text-7C4DCC bb-bg-E9DDFC-50 rounded-2xl py-3 active:scale-95 transition"
      >
        {open ? "Хаах" : "Харах"}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
          <div className="mt-3 text-sm font-semibold text-slate-600 leading-relaxed bloom-fade">
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
