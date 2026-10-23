"use client";

import { useFriends } from "../../../context/FriendsContext";
import { SOS_REPLIES, placeOf } from "../../../lib/friends";
import { formatTime } from "../../../lib/dates";

/** Найз маань хэрэглэл хэрэгтэй байна — нэг товшилтоор хариулах карт */
export default function IncomingSosCard() {
  const { incoming, respond, replyText } = useFriends();
  if (!incoming.length) return null;

  return (
    <div className="space-y-3">
      {incoming.map((r) => (
        <div key={r.id} className="relative overflow-hidden rounded-3xl p-4 border bb-border-F48FB1 bb-grad-9 shadow-sm bloom-pop">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-xl shrink-0 shadow-sm">🆘</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-800 leading-snug">
                {r.sender_name}: Яг одоо хэрэглэл хэрэгтэй байна
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {placeOf(r.place).short ? `📍 ${placeOf(r.place).short} · ` : ""}{formatTime(r.created_at)}
              </p>
            </div>
          </div>
          {r.myReply ? (
            <p className="mt-3 rounded-2xl bg-white/75 px-3 py-2 text-xs font-extrabold bb-text-B83B7E">
              ✓ Чиний хариу: {replyText(r.myReply)}
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Object.entries(SOS_REPLIES).map(([code, text]) => (
                <button
                  key={code}
                  onClick={() => respond(r, code)}
                  className={`bx-tap rounded-2xl px-2 py-2 text-xs font-extrabold leading-snug active:scale-95 transition ${
                    code === "no"
                      ? "bg-white text-slate-500 border-2 border-slate-100"
                      : "bb-grad-sos text-white"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
