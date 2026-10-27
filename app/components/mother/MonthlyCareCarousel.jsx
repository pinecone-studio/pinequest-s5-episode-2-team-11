"use client";

import { useEffect, useRef, useState } from "react";
import { HeartHandshake, ArrowLeft, ArrowRight, MessageCircleHeart, RefreshCw } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { supabase } from "../../../lib/supabase";
import { askAi } from "../../../lib/ai-client";
import { cycleStatus, toDateStr } from "../../../lib/dates";
import { getPhaseKey } from "../../../lib/helpers";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import ThinkingDots from "../ui/ThinkingDots";

const SWIPE_RATIO = 0.2; // өргөний 20%-иас илүү чирвэл дараагийн охин руу шилжинэ

const childPhase = (child) => {
  const cycleLength = child.cycle_length ?? 28;
  const cycle = cycleStatus(child.last_period_start, cycleLength);
  return cycle ? getPhaseKey(cycle.day, cycleLength, child.period_length ?? 5) : null;
};

/**
 * Охин бүрийн сүүлийн 30 хоногийн ангилсан бүртгэлийг (day_logs) AI-аар шинжилж, халамжийн зөвлөгөө өгнө.
 * Охин бүр нэг слайд — хуруугаар зүүн/баруун шудрах эсвэл сумаар шилжинэ.
 * Охины хувийн бичвэр тэмдэглэл зөвхөн түүний утсан дээр тул энд ОРОХГҮЙ.
 */
export default function MonthlyCareCarousel() {
  const { children, session } = useFamily();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({}); // childId → { status, data, days }
  const [drag, setDrag] = useState(0);
  const viewportRef = useRef(null);
  const pointer = useRef(null); // { x, y, axis }
  const today = toDateStr();

  const count = children.length;
  const current = Math.min(index, Math.max(0, count - 1));
  const child = children[current];
  const goTo = (i) => setIndex(Math.max(0, Math.min(count - 1, i)));

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

  // Слайд харагдах үед л тэр охины шинжилгээг ачаална
  useEffect(() => {
    if (child && !results[child.id]) analyze(child);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child?.id]);

  /* ---------- Шудрах (touch + хулгана) ---------- */
  const onPointerDown = (e) => {
    if (count < 2) return;
    pointer.current = { x: e.clientX, y: e.clientY, axis: null };
  };
  const onPointerMove = (e) => {
    const p = pointer.current;
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      p.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (p.axis === "x") e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (p.axis !== "x") return;
    const atEdge = (current === 0 && dx > 0) || (current === count - 1 && dx < 0);
    setDrag(atEdge ? dx / 3 : dx); // эхэн/төгсгөлд уян эсэргүүцэл
  };
  const onPointerEnd = () => {
    const p = pointer.current;
    pointer.current = null;
    if (!p || p.axis !== "x") return;
    const width = viewportRef.current?.offsetWidth ?? 300;
    if (Math.abs(drag) > width * SWIPE_RATIO) goTo(current + (drag < 0 ? 1 : -1));
    setDrag(0);
  };

  if (!child) return null;
  const currentResult = results[child.id];
  const dragging = pointer.current?.axis === "x";

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

      <div
        ref={viewportRef}
        className="overflow-hidden select-none"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div
          className="flex items-start"
          style={{
            transform: `translateX(calc(${-current * 100}% + ${drag}px))`,
            transition: dragging ? "none" : "transform 300ms ease",
          }}
        >
          {children.map((c) => (
            <div key={c.id} className="w-full shrink-0 px-0.5" aria-hidden={c.id !== child.id}>
              <Slide child={c} result={results[c.id]} onRetry={() => analyze(c, true)} />
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <SwipeControl
          current={current}
          count={count}
          drag={drag}
          onPrev={() => goTo(current - 1)}
          onNext={() => goTo(current + 1)}
        />
      )}
    </Card>
  );
}

/**
 * Шудрах удирдлага: [← ● →] хэлбэрийн капсул. Эхний охин дээр зөвхөн →, сүүлийн дээр зөвхөн ←.
 * Төв бөмбөлөг нь хэд дэх охин болохыг харуулж, чирэх үед бага зэрэг дагаж хөдөлнө.
 */
function SwipeControl({ current, count, drag, onPrev, onNext }) {
  const hasPrev = current > 0;
  const hasNext = current < count - 1;
  const nudge = Math.max(-12, Math.min(12, drag / 8));
  const arrow = "h-full px-3 flex items-center bb-text-B83B7E active:scale-90 transition";

  return (
    <div className="mt-4 flex justify-center">
      <div className="h-11 flex items-center rounded-full border-2 bb-border-F48FB1 bg-white">
        {hasPrev && (
          <button onClick={onPrev} className={arrow} aria-label="Өмнөх охин">
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
        <span
          className="-my-0.5 w-11 h-11 shrink-0 rounded-full border-2 bb-border-F48FB1 bb-bg-E0679F text-white flex items-center justify-center text-xs font-black shadow-md"
          style={{ transform: `translateX(${nudge}px)`, transition: drag ? "none" : "transform 300ms ease" }}
          aria-live="polite"
        >
          {current + 1}/{count}
        </span>
        {hasNext && (
          <button onClick={onNext} className={arrow} aria-label="Дараагийн охин">
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
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
