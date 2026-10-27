"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Heart, LoaderCircle, Moon, Sparkles } from "lucide-react";
import { askAi } from "../../../lib/ai-client";
import { useFamily } from "../../../context/FamilyContext";

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function readPreviousPrePeriodEntries(lastPeriodStart, cycleLength, today) {
  const prefix = "bloom:tracker-log:";
  const periodStart = new Date(`${lastPeriodStart}T00:00:00`);
  const entries = [];
  try {
    Object.keys(window.localStorage).forEach((key) => {
      if (!key.startsWith(prefix)) return;
      const dateKey = key.slice(prefix.length);
      if (dateKey >= lastPeriodStart || dateKey >= today || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;
      let dayLog;
      try { dayLog = JSON.parse(window.localStorage.getItem(key)); } catch { return; }
      const date = new Date(`${dateKey}T00:00:00`);
      const diff = Math.floor((date - periodStart) / 86400000);
      const cycleOffset = ((diff % cycleLength) + cycleLength) % cycleLength;
      const daysBeforePeriod = cycleLength - cycleOffset;
      if (daysBeforePeriod < 3 || daysBeforePeriod > 5) return;
      const values = { ...(dayLog?.AM ?? {}), ...(dayLog?.PM ?? {}) };
      const filtered = {};
      ["emotion", "skin", "symptoms", "sleep", "period"].forEach((category) => {
        if (typeof values[category] === "string") filtered[category] = values[category];
      });
      if (Object.keys(filtered).length) entries.push({ date: dateKey, daysBeforePeriod, values: filtered });
    });
  } catch {
    return [];
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
}

const configMessages = {
  ai_not_configured: "AI тохиргоо дутуу байна. Серверт GEMINI_API_KEY нэмэх шаардлагатай.",
  ai_invalid_key: "Gemini API түлхүүр хүчингүй байна. Google AI Studio-оос түлхүүрээ шалгана уу.",
  ai_quota_exceeded: "Gemini API-н хэрэглээний хязгаарт хүрсэн байна. Google AI Studio дээр quota тохиргоог шалгана уу.",
  unauthorized: "Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрч оролдоорой.",
  ai_failed: "AI үйлчилгээ хүсэлтэд хариу өгсөнгүй. Серверийн API түлхүүр, model тохиргоог шалгана уу.",
  timeout: "AI хариу удааширлаа. Дахин оролдоорой.",
  network_error: "Сервертэй холбогдож чадсангүй. Интернэтээ шалгана уу.",
};

export default function CyclePredictionCard({ daysUntil, cycleLength, lastPeriodStart }) {
  const { session } = useFamily();
  const [prediction, setPrediction] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lastPeriodStart || !cycleLength || daysUntil < 3 || daysUntil > 5) return;
    let mounted = true;
    const today = localDateKey(new Date());
    const expectedDate = new Date(`${lastPeriodStart}T00:00:00`);
    expectedDate.setDate(expectedDate.getDate() + cycleLength);
    const cacheKey = `bloom:cycle-prediction:${localDateKey(expectedDate)}`;
    let entries = [];
    try {
      entries = readPreviousPrePeriodEntries(lastPeriodStart, cycleLength, today);
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        setPrediction(JSON.parse(cached));
        return () => { mounted = false; };
      }
    } catch {
      setMessage("Өмнөх бүртгэлүүдийг уншиж чадсангүй.");
      return () => { mounted = false; };
    }
    if (!entries.length) return () => { mounted = false; };

    setLoading(true);
    askAi(session, { type: "cycle_prediction", daysUntil, entries }, 30000, { detailed: true })
      .then((response) => {
        if (!mounted) return;
        if (response?.prediction && Array.isArray(response.tips)) {
          setPrediction(response);
          try { window.localStorage.setItem(cacheKey, JSON.stringify(response)); } catch { /* cache is optional */ }
        } else {
          setMessage(configMessages[response?.error] ?? "Таамгийг гаргаж чадсангүй. Дахин оролдоорой.");
        }
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [daysUntil, cycleLength, lastPeriodStart, session]);

  if (!lastPeriodStart || daysUntil < 3 || daysUntil > 5) return null;

  return (
    <section className="rounded-3xl border border-pink-200 bg-white p-4 shadow-sm bloom-fade">
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E"><Sparkles className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-black text-slate-700">Мөчлөгийн өмнөх хувийн таамаг</h2>
          <p className="text-xs font-bold bb-text-B83B7E">Сарын тэмдэг ойртож байна</p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Өмнөх мөчлөгүүдийн 3–5 хоногийн өмнөх ангилсан бүртгэлийг AI үйлчилгээнд боловсруулахаар илгээнэ. Хувийн өдрийн тэмдэглэлийн бичвэр илгээгдэхгүй.
      </p>

      {loading && <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600"><LoaderCircle className="h-4 w-4 animate-spin" /> Таны өмнөх бүртгэлийг харьцуулж байна…</p>}

      {!loading && !prediction && !message && (
        <p className="mt-4 flex items-start gap-2 text-sm font-semibold leading-relaxed text-slate-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 bb-text-7C4DCC" />
          Өмнөх мөчлөгийн энэ өдрүүдийн бүртгэл хараахан алга. Дараагийн удаа сэтгэл хөдлөл, шинж тэмдэг, нойроо тэмдэглэвэл өөрийн хэв маягийг гаргаж эхэлнэ.
        </p>
      )}

      {message && <p role="status" className="mt-4 text-sm font-bold text-rose-600">{message}</p>}

      {prediction && (
        <div className="mt-4 space-y-3">
          <p className="rounded-2xl bb-bg-FDE7F1-50 p-3 text-sm font-bold leading-relaxed text-slate-700">{prediction.prediction}</p>
          {prediction.pattern && <p className="text-sm leading-relaxed text-slate-600">{prediction.pattern}</p>}
          {prediction.tips.length > 0 && (
            <div className="space-y-2">
              {prediction.tips.map((tip, index) => (
                <p key={`${index}-${tip}`} className="flex items-start gap-2 text-sm font-semibold leading-relaxed text-slate-600">
                  {index === 0 ? <Heart className="mt-0.5 h-4 w-4 shrink-0 bb-text-B83B7E" /> : <Moon className="mt-0.5 h-4 w-4 shrink-0 bb-text-7C4DCC" />}
                  {tip}
                </p>
              ))}
            </div>
          )}
          {prediction.dataNote && <p className="border-t border-slate-100 pt-2 text-xs text-slate-400">{prediction.dataNote}</p>}
        </div>
      )}
    </section>
  );
}
