"use client";

import { useCallback, useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { authJson } from "../../../lib/api-client";
import { TALK_REPLIES } from "../../../lib/notificationEvents";
import { relativeTimeMn } from "../../../lib/relative-time";
import Card from "../ui/Card";

/**
 * Guardian home: «Охин чинь танд хуваалцлаа» — only what the girl chose to send.
 * Nothing is rendered when she hasn't sent anything.
 */
export default function SharedSignals() {
  const { setToast } = useFamily();
  const [talks, setTalks] = useState([]);

  const load = useCallback(() => authJson("/api/talk").then((result) => setTalks(result.requests ?? [])), []);
  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    const timer = setInterval(load, 60_000);
    return () => { window.removeEventListener("focus", load); clearInterval(timer); };
  }, [load]);

  const reply = async (talk, key) => {
    setTalks((list) => list.map((item) => (item.id === talk.id ? { ...item, reply: key } : item)));
    const result = await authJson("/api/talk", "POST", { action: "reply", id: talk.id, reply: key });
    if (result.error) { setToast("Илгээж чадсангүй. Дахин оролдоно уу."); load(); return; }
    setToast(`${talk.daughterName}-д хариу очлоо 💗`);
  };

  if (!talks.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-sm font-black text-slate-700">Охин чинь танд хуваалцлаа</h3>
      {talks.map((talk) => (
        <Card key={talk.id} className="!p-4">
          <p className="text-sm font-black text-slate-800">💬 {talk.daughterName} тантай ярилцмаар байна</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{talk.topicLabel ? `Сэдэв: ${talk.topicLabel} · ` : ""}{relativeTimeMn(talk.createdAt)}</p>
          {talk.reply ? (
            <p className="mt-3 rounded-2xl bb-bg-FDE7F1-50 px-3 py-2 text-xs font-extrabold bb-text-B83B7E">✓ Хариулсан: {TALK_REPLIES[talk.reply]?.label}</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Object.entries(TALK_REPLIES).map(([key, { label }]) => (
                <button key={key} type="button" onClick={() => reply(talk, key)} className="rounded-2xl bb-bg-E0679F px-1 py-2.5 text-xs font-extrabold text-white active:scale-95">{label}</button>
              ))}
            </div>
          )}
        </Card>
      ))}
    </section>
  );
}
