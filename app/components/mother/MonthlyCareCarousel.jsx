"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, MessageCircleHeart, RefreshCw } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { supabase } from "../../../lib/supabase";
import { askAi } from "../../../lib/ai-client";
import { cycleStatus, toDateStr } from "../../../lib/dates";
import { getPhaseKey } from "../../../lib/helpers";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import ThinkingDots from "../ui/ThinkingDots";

const childPhase = (child) => {
  const cycleLength = child.cycle_length ?? 28;
  const cycle = cycleStatus(child.last_period_start, cycleLength);
  return cycle ? getPhaseKey(cycle.day, cycleLength, child.period_length ?? 5) : null;
};

/**
 * Охин бүрийн сүүлийн 30 хоногийн ангилсан бүртгэлийг (day_logs) AI-аар шинжилж, халамжийн зөвлөгөө өгнө.
 * Зөвхөн сонгосон охины зөвлөгөөг харуулна.
 * Охины хувийн бичвэр тэмдэглэл зөвхөн түүний утсан дээр тул энд ОРОХГҮЙ.
 */
export default function MonthlyCareCarousel() {
  const { children, activeChildId, session } = useFamily();
  const [results, setResults] = useState({}); // childId → { status, data, days }
  const today = toDateStr();
  const child = children.find((item) => item.id === activeChildId) ?? children[0];

  const setResult = (id, value) => setResults((prev) => ({ ...prev, [id]: value }));

  const analyze = async (target, force = false) => {
    if (!supabase || !target) return;
    const cacheKey = `bloom:monthly-care:v2:${target.id}:${today}`;
    setResult(target.id, { status: "loading", data: null, days: 0 });
    const { data: rows, error } = await supabase
      .from("day_logs")
      .select("log_date, emotion, symptoms, period, skin, sleep")
      .eq("user_id", target.id)
      .gte("log_date", toDateStr(new Date(Date.now() - 30 * 86400000)))
      .order("log_date");
    if (error) console.warn("[day_logs] monthly:", error.message);
    if (!rows?.length) {
      setResult(target.id, { status: "empty", data: null, days: 0 });
      return;
    }
    if (!force) {
      try {
        const saved = JSON.parse(localStorage.getItem(cacheKey) ?? "null");
        if (saved?.summary) {
          setResult(target.id, { status: "done", data: saved, days: rows.length });
          return;
        }
      } catch {}
    }
    const result = await askAi(
      session,
      {
        type: "monthly_care",
        daughterName: target.display_name ?? "",
        phase: childPhase(target),
        days: rows.map((r) => ({ date: r.log_date, emotion: r.emotion, symptoms: r.symptoms, period: r.period, skin: r.skin, sleep: r.sleep })),
      },
      30000,
    );
    if (!result?.summary) {
      setResult(target.id, { status: "error", data: null, days: rows.length });
      return;
    }
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {}
    setResult(target.id, { status: "done", data: result, days: rows.length });
  };

  // Сонгосон охины шинжилгээг ачаална
  useEffect(() => {
    if (child && !results[child.id]) analyze(child);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child?.id]);

  if (!child) return null;
  const currentResult = results[child.id];

  return (
    <Card>
      <SectionTitle
        icon={HeartHandshake}
        title="Сарын халамжийн зөвлөгөө"
        right={
          currentResult?.status === "done" && (
            <button
              onClick={() => analyze(child, true)}
              className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center active:scale-90"
              aria-label="Дахин шинжлэх"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          )
        }
      />

      <Slide child={child} result={currentResult} onRetry={() => analyze(child, true)} />
    </Card>
  );
}

function Slide({ child, result, onRetry }) {
  const name = child.display_name || "Охин";
  const { status, data, days } = result ?? { status: "loading" };

  return (
    <div>
      <div className="text-center">
        <p className="font-black text-slate-700">{name}</p>
        <p className="text-xs font-semibold text-slate-400">
          Сүүлийн 30 хоног{days ? ` · ${days} өдрийн бүртгэл` : ""}
        </p>
      </div>

      <div className="mt-3 min-h-24">
        {status === "loading" && <ThinkingDots label="Сарын бүртгэлийг шинжилж байна…" />}
        {status === "empty" && (
          <p className="rounded-2xl bb-bg-FFF7FB p-4 text-sm font-semibold text-slate-500">
            {child.share_mood === false
              ? `${name} бүртгэлээ хуваалцах тохиргоог унтраасан байна. Түүний хувийн орон зайг хүндэтгэе 🤍`
              : `${name} сүүлийн 1 сард өдрийн бүртгэл хөтлөөгүй байна.`}
          </p>
        )}
        {status === "error" && (
          <div className="rounded-2xl bb-bg-FFF7FB p-4 text-sm font-semibold text-slate-500">
            AI зөвлөгөө гаргаж чадсангүй.{" "}
            <button onClick={onRetry} className="font-extrabold bb-text-B83B7E underline">
              Дахин оролдох
            </button>
          </div>
        )}
        {status === "done" && data && (
          <div className="space-y-3 text-sm font-semibold text-slate-600 leading-relaxed">
            <p>{data.summary}</p>
            {data.tips?.length > 0 && (
              <ul className="space-y-2">
                {data.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="bb-text-B83B7E">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.talk && (
              <p className="flex gap-2 rounded-2xl bb-grad-5 p-3 text-slate-600">
                <MessageCircleHeart className="w-4 h-4 mt-0.5 shrink-0 bb-text-B83B7E" />
                <span>«{data.talk}»</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
