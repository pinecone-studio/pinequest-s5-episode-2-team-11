"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { authJson } from "../../../lib/api-client";
import { TALK_TOPICS } from "../../../lib/connection";
import BottomSheet from "../ui/BottomSheet";

/** Sends «Ярилцмаар байна» with an optional topic. */
export async function sendTalkRequest(topic, setToast) {
  const result = await authJson("/api/talk", "POST", { action: "request", topic });
  if (result.error === "too_soon") setToast("Саяхан илгээсэн байна. Түр хүлээгээрэй 💗");
  else if (result.error === "not_linked") setToast("Эхлээд асран хамгаалагчтайгаа холбогдоорой.");
  else if (result.error) setToast("Илгээж чадсангүй. Дахин оролдоно уу.");
  else setToast("Илгээлээ 💬 Хариу ирэхэд мэдэгдэнэ.");
  return !result.error;
}

export default function TalkRequestSheet({ onClose }) {
  const { setToast, linked } = useFamily();
  const [topic, setTopic] = useState(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    const ok = await sendTalkRequest(topic, setToast);
    setSending(false);
    if (ok) onClose();
  };

  return (
    <BottomSheet title="💬 Ярилцмаар байна" onClose={onClose}>
      <div className="space-y-4 pb-2">
        <p className="text-sm font-semibold leading-relaxed text-slate-600">Асран хамгаалагчдаа «ярилцмаар байна» гэж хэлье. Сэдвээ сонгох заавал биш.</p>
        <div className="flex flex-wrap gap-2">
          {TALK_TOPICS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={topic === id} onClick={() => setTopic(topic === id ? null : id)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-extrabold ${topic === id ? "bb-border-F48FB1 bb-bg-FDE7F1 bb-text-B83B7E" : "border-slate-100 bg-white text-slate-600"}`}>{label}</button>
          ))}
        </div>
        {!linked && <p className="text-xs font-semibold text-slate-400">Илгээхийн тулд асран хамгаалагчтайгаа холбогдсон байх хэрэгтэй.</p>}
        <button type="button" onClick={send} disabled={sending || !linked} className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white disabled:opacity-50">
          {sending ? "Илгээж байна…" : "Илгээх"}
        </button>
      </div>
    </BottomSheet>
  );
}
