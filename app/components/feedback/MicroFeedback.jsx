"use client";

import { useEffect, useState } from "react";
import { feedbackRequest } from "../../../lib/feedback-client";

const THUMBS = [["up", "👍"], ["down", "👎"]];
const memoryKey = (type, id) => `bloomy:micro:${type}:${id}`;

/**
 * One tap, no text. After tapping it says «Баярлалаа 💗»; tapping «Өөрчлөх»
 * lets her change the answer (the server keeps one per item).
 */
export default function MicroFeedback({ targetType, targetId, question, options = THUMBS, className = "" }) {
  const [answer, setAnswer] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try { setAnswer(localStorage.getItem(memoryKey(targetType, targetId))); } catch { setAnswer(null); }
  }, [targetType, targetId]);

  const send = async (value) => {
    setAnswer(value);
    setEditing(false);
    try { localStorage.setItem(memoryKey(targetType, targetId), value); } catch { /* localStorage боломжгүй */ }
    const result = await feedbackRequest("micro", { targetType, targetId, value });
    if (result.error) console.warn("[feedback] micro:", result.error);
  };

  if (answer && !editing) {
    return (
      <p className={`flex items-center gap-2 text-xs font-bold text-slate-400 ${className}`}>
        Баярлалаа 💗
        <button type="button" onClick={() => setEditing(true)} className="text-[11px] font-extrabold underline">Өөрчлөх</button>
      </p>
    );
  }
  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 ${className}`}>
      <span>{question}</span>
      {options.map(([value, label]) => (
        <button key={value} type="button" onClick={() => send(value)} aria-pressed={answer === value}
          className={`min-h-8 rounded-full border px-2.5 py-1 text-sm font-extrabold transition active:scale-95 ${answer === value ? "bb-border-F48FB1 bb-bg-FDE7F1" : "border-slate-200 bg-white"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
