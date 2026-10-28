"use client";

import { useCallback, useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { authJson } from "../../../lib/api-client";
import { SIGNAL_TYPE_BY_EVENT } from "../../../lib/emotionCoaching";
import { TALK_REPLIES } from "../../../lib/notificationEvents";
import { sendNotification } from "../../../lib/push-client";
import { relativeTimeMn } from "../../../lib/relative-time";
import { supabase } from "../../../lib/supabase";
import Card from "../ui/Card";
import CoachingCarousel from "./CoachingCarousel";

const WINDOW_MS = 48 * 3_600_000;
// Existing support cards (lib/data.js MOM_QUICK_NOTES) the guardian can send back with one tap.
const SUPPORT_CARDS = ["Чамайгаа тэврье 🤍", "Чамаар бахархаж байна 🌸"];

/**
 * Guardian home: «Охин чинь танд хуваалцлаа» — only signals the girl chose to send
 * (pain signal, «Ярилцмаар байна») in the last 48 h. Each card: coaching + one-tap replies.
 * Nothing is rendered when she hasn't sent anything.
 */
export default function SharedSignals() {
  const { profile, session, setToast } = useFamily();
  const [talks, setTalks] = useState([]);
  const [signals, setSignals] = useState([]);
  const [coaching, setCoaching] = useState(null);
  const [sent, setSent] = useState({});

  const load = useCallback(async () => {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const [talkResult, signalResult] = await Promise.all([
      authJson("/api/talk"),
      profile?.id && supabase
        ? supabase.from("notifications").select("id, sender_id, body, created_at").eq("recipient_id", profile.id).eq("event", "guardian_signal").gte("created_at", since).order("created_at", { ascending: false }).limit(10)
        : { data: [] },
    ]);
    setTalks(talkResult.requests ?? []);
    setSignals(signalResult.data ?? []);
  }, [profile?.id]);

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

  const support = async (cardKey, daughterId, text) => {
    if (!daughterId) return;
    const { ok } = await sendNotification(session, "guardian_message", [daughterId], text);
    if (ok) setSent((value) => ({ ...value, [cardKey]: text }));
    setToast(ok ? "Илгээлээ 💗" : "Илгээж чадсангүй. Дахин оролдоно уу.");
  };

  const items = [
    ...signals.map((signal) => ({ key: `signal-${signal.id}`, type: SIGNAL_TYPE_BY_EVENT.guardian_signal, daughterId: signal.sender_id, title: `🌡️ ${signal.body}`, createdAt: signal.created_at })),
    ...talks.map((talk) => ({ key: `talk-${talk.id}`, type: "talk", daughterId: talk.daughterId, title: `💬 ${talk.daughterName} тантай ярилцмаар байна`, createdAt: talk.createdAt, talk })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-sm font-black text-slate-700">Охин чинь танд хуваалцлаа</h3>
      {items.map((item) => (
        <Card key={item.key} className="!p-4">
          <p className="text-sm font-black text-slate-800">{item.title}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.talk?.topicLabel ? `Сэдэв: ${item.talk.topicLabel} · ` : ""}{relativeTimeMn(item.createdAt)}</p>

          {item.talk && (item.talk.reply ? (
            <p className="mt-3 rounded-2xl bb-bg-FDE7F1-50 px-3 py-2 text-xs font-extrabold bb-text-B83B7E">✓ Хариулсан: {TALK_REPLIES[item.talk.reply]?.label}</p>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {Object.entries(TALK_REPLIES).map(([key, { label }]) => (
                <button key={key} type="button" onClick={() => reply(item.talk, key)} className="rounded-2xl bb-bg-E0679F px-1 py-2.5 text-xs font-extrabold text-white active:scale-95">{label}</button>
              ))}
            </div>
          ))}

          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => setCoaching(item.type)} className="rounded-full bb-bg-E9DDFC-50 px-3 py-1.5 text-xs font-extrabold bb-text-7C4DCC">💡 Яаж хариулах вэ?</button>
            {sent[item.key]
              ? <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-500">✓ {sent[item.key]}</span>
              : SUPPORT_CARDS.map((text) => (
                <button key={text} type="button" onClick={() => support(item.key, item.daughterId, text)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-600">{text}</button>
              ))}
          </div>
        </Card>
      ))}
      {coaching && <CoachingCarousel type={coaching} onClose={() => setCoaching(null)} />}
    </section>
  );
}
