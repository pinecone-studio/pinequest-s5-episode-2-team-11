"use client";

/**
 * Алхалтын горим — дүр чинь хамт алхана, 100 алхам тутамд +5 XP, +5 дэлбээ.
 * Утсан дээр жинхэнэ алхам тоолно; компьютер/танилцуулга дээр «Демо алхалт».
 */

import { useEffect, useRef, useState } from "react";
import { Footprints, Play, Square, Sparkles } from "lucide-react";
import Avatar from "./Avatar";
import { Cloud, Flower, PetalIcon, Tree, XpIcon } from "./icons";
import { useStepCounter } from "./useStepCounter";
import { REWARD_PER_STEP_BLOCK, STEPS_PER_REWARD, WALK_XP_DAILY_CAP } from "../../../lib/wardrobe";

const SCENE = `
.wk-strip{animation:wkMove 1.2s linear infinite}
.wk-far{animation:wkMove 6s linear infinite}
.wk-paused .wk-strip,.wk-paused .wk-far{animation-play-state:paused}
@keyframes wkMove{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion: reduce){.wk-strip,.wk-far{animation:none}}
`;

const DEMO_STEPS_PER_TICK = 10; // 0.25 секунд тутамд — танилцуулгад хурдасгасан (~1 минутад 2-р түвшин)

export default function WalkMode({ av }) {
  const [moving, setMoving] = useState(false);
  const [demo, setDemo] = useState(false);
  const stopTimer = useRef(null);

  const bump = (n) => {
    av.addSteps(n);
    setMoving(true);
    clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => setMoving(false), 1300);
  };
  const bumpRef = useRef(bump);
  bumpRef.current = bump;

  const counter = useStepCounter((n) => bumpRef.current(n));
  const running = counter.status === "running";

  useEffect(() => {
    if (!demo) return;
    const t = setInterval(() => bumpRef.current(DEMO_STEPS_PER_TICK), 250);
    return () => clearInterval(t);
  }, [demo]);

  useEffect(() => () => clearTimeout(stopTimer.current), []);

  const w = av.walkToday;
  const capped = w.xp >= WALK_XP_DAILY_CAP;
  const toNext = STEPS_PER_REWARD - (w.steps % STEPS_PER_REWARD);
  const pct = ((w.steps % STEPS_PER_REWARD) / STEPS_PER_REWARD) * 100;

  const toggleSensor = async () => {
    if (running) return counter.stop();
    setDemo(false);
    await counter.start();
  };

  const toggleDemo = () => {
    if (running) counter.stop();
    setDemo((d) => !d);
  };

  return (
    <div className="space-y-4">
      <style>{SCENE}</style>

      {/* ---------- Алхаж буй дүр ---------- */}
      <div
        className={`relative overflow-hidden rounded-3xl border bb-border-F8D3E6 ${moving ? "" : "wk-paused"}`}
        style={{ height: 250, background: "linear-gradient(180deg,#FDE7F1 0%,#F1E8FE 62%,#CDEBD9 62%,#B9E0C8 100%)" }}
      >
        {/* алс дахь үүл, мод */}
        <div className="wk-far absolute flex" style={{ top: 18, left: 0, width: "200%", height: 150 }}>
          {[0, 1].map((k) => (
            <div key={k} className="relative" style={{ width: "50%" }}>
              <span className="absolute" style={{ left: "6%", top: 6 }}><Cloud w={60} /></span>
              <span className="absolute" style={{ left: "58%", top: 22 }}><Cloud w={44} opacity={0.75} /></span>
              <span className="absolute" style={{ left: "26%", top: 78 }}><Tree h={70} /></span>
              <span className="absolute" style={{ left: "80%", top: 90 }}><Tree h={56} tone="#B5DEC8" /></span>
            </div>
          ))}
        </div>
        {/* зам */}
        <div className="wk-strip absolute flex" style={{ bottom: 10, left: 0, width: "200%" }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex justify-around items-end" style={{ width: "50%" }}>
              <Flower size={16} color="#FFD45C" />
              <span className="rounded-full bg-white/70" style={{ width: 34, height: 6, marginBottom: 6 }} />
              <Flower size={14} color="#B794F4" />
              <span className="rounded-full bg-white/70" style={{ width: 34, height: 6, marginBottom: 6 }} />
              <Flower size={16} />
            </div>
          ))}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 16 }}>
          <Avatar look={av.look} skin={av.skin} walking={moving} size={118} />
        </div>
        {moving && (
          <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold bb-text-B83B7E">
            {demo ? "Демо алхалт" : "Алхаж байна…"}
          </span>
        )}
      </div>

      {/* ---------- Өнөөдөр ---------- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-100 p-3">
          <p className="text-xs font-extrabold text-slate-400 flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5" /> Өнөөдөр
          </p>
          <p className="text-2xl font-black text-slate-800">{w.steps.toLocaleString()}</p>
          <p className="text-xs font-semibold text-slate-400">алхам</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-3">
          <p className="text-xs font-extrabold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Алхалтын XP
          </p>
          <p className="text-2xl font-black text-slate-800">
            {w.xp}
            <span className="text-sm text-slate-400"> / {WALK_XP_DAILY_CAP}</span>
          </p>
          <p className="text-xs font-semibold text-slate-400">өдрийн дээд хэмжээ</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs font-extrabold text-slate-500 mb-1">
          <span>{capped ? "Өнөөдрийн XP дүүрлээ" : `Дараагийн шагнал хүртэл ${toNext} алхам`}</span>
          <span className="bb-text-B83B7E inline-flex items-center gap-1">
            <XpIcon size={12} /> +{REWARD_PER_STEP_BLOCK} <PetalIcon size={12} /> +{REWARD_PER_STEP_BLOCK}
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bb-grad-sos transition-all" style={{ width: `${capped ? 100 : pct}%` }} />
        </div>
      </div>

      {/* ---------- Товчнууд ---------- */}
      <button
        onClick={toggleSensor}
        className={`w-full rounded-2xl py-4 font-extrabold flex items-center justify-center gap-2 active:scale-95 transition ${
          running ? "bg-white border-2 bb-border-F48FB1 bb-text-B83B7E" : "bb-grad-sos text-white shadow-lg bx-shadow-sos"
        }`}
      >
        {running ? <Square className="w-4 h-4" /> : <Footprints className="w-5 h-5" />}
        {running ? "Алхалт зогсоох" : "Алхалт эхлүүлэх"}
      </button>
      <button
        onClick={toggleDemo}
        className={`w-full rounded-2xl py-3 text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition ${
          demo ? "bb-bg-B794F4 text-white" : "bb-bg-E9DDFC bb-text-7C4DCC"
        }`}
      >
        {demo ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {demo ? "Демо зогсоох" : "Демо алхалт (танилцуулгад)"}
      </button>

      {counter.status === "denied" && (
        <p className="text-xs font-semibold bb-text-7C4DCC text-center">
          Хөдөлгөөн мэдрэгчийн зөвшөөрөл өгөөгүй байна. Демо алхалтаар үзүүлж болно.
        </p>
      )}
      {counter.status === "nosensor" && (
        <p className="text-xs font-semibold bb-text-7C4DCC text-center">
          Энэ төхөөрөмж алхам мэдрэхгүй байна (компьютер). Утсаар оролдох эсвэл демо алхалт ашиглаарай.
        </p>
      )}
      <p className="text-xs font-semibold text-slate-400 text-center leading-relaxed">
        Одоогоор апп нээлттэй үед л тоолно. Жинхэнэ апп болоход өдрийн бүх алхмыг утасны Health-ээс авна.
      </p>
    </div>
  );
}
