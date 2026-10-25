"use client";

/**
 * Охины «Мэдэгдэл» хуудас — асран хамгаалагчийнхтай ижил загвар.
 * Нэг жагсаалтад: асран хамгаалагчийн үг, найзын SOS (шууд хариулна), миний SOS-д ирсэн хариу.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { useFriends } from "../../../context/FriendsContext";
import { SOS_REPLIES, placeOf } from "../../../lib/friends";
import { formatTime } from "../../../lib/dates";
import SectionTitle from "../ui/SectionTitle";
import Card from "../ui/Card";
import PageHeader from "../ui/PageHeader";

const ICON = { sos: "🆘", reply: "💬", care: "💌", supply: "🛍️", period: "🩸" };

export default function DaughterMessages() {
  const router = useRouter();
  const { teenInbox, markRead, setTab } = useFamily();
  const { incoming, outgoing, respond, replyText } = useFriends();

  // Хуудсыг нээхэд асран хамгаалагчийн мэдэгдлийг уншсан болгоно
  useEffect(() => {
    teenInbox.filter((n) => !n.read).forEach((n) => markRead(n.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teenInbox.length]);

  const items = [
    ...incoming.map((r) => ({
      key: `sos-${r.id}`,
      kind: "sos",
      at: r.created_at,
      text: `${r.sender_name}: Яг одоо хэрэглэл хэрэгтэй байна${placeOf(r.place).short ? ` · 📍 ${placeOf(r.place).short}` : ""}`,
      sos: r,
    })),
    ...(outgoing?.responses ?? []).map((r) => ({
      key: `reply-${r.responder_name}-${r.created_at}`,
      kind: "reply",
      at: r.created_at,
      text: `${r.responder_name}: ${replyText(r.reply)}`,
    })),
    ...teenInbox.map((n) => ({
      key: `n-${n.id}`,
      kind: n.kind === "supply" || n.kind === "period" ? n.kind : "care",
      at: n.created_at,
      text: n.text,
    })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bloom-fade">
        <button
          onClick={() => {
            setTab("home");
            router.replace("/daughter");
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm border border-slate-100 active:scale-90"
          aria-label="Буцах"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <PageHeader sub="Найз, асран хамгаалагчаас" title="Мэдэгдэл 💌" />
      </div>

      <Card>
        <SectionTitle icon={Bell} title="Ирсэн мэдэгдэл" />
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 font-semibold py-6 text-center">Одоогоор мэдэгдэл алга 🌸</p>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <div
                key={n.key}
                className={`flex items-start gap-3 rounded-2xl px-3 py-3 ${n.kind === "sos" ? "bb-bg-E9DDFC-50" : "bb-bg-FFF7FB"}`}
              >
                <span className="text-xl">{ICON[n.kind] ?? "🌸"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 leading-snug">{n.text}</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{formatTime(n.at)}</p>

                  {n.sos &&
                    (n.sos.myReply ? (
                      <p className="mt-2 text-xs font-extrabold bb-text-B83B7E">✓ Чиний хариу: {replyText(n.sos.myReply)}</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {Object.entries(SOS_REPLIES).map(([code, text]) => (
                          <button
                            key={code}
                            onClick={() => respond(n.sos, code)}
                            className={`rounded-xl px-2 py-1.5 text-xs font-extrabold leading-snug active:scale-95 transition ${
                              code === "no" ? "bg-white text-slate-500 border border-slate-100" : "bb-grad-sos text-white"
                            }`}
                          >
                            {text}
                          </button>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
