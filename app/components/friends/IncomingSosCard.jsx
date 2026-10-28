"use client";

import { useFriends } from "../../../context/FriendsContext";
import { SOS_REPLIES, placeOf } from "../../../lib/friends";
import { formatTime } from "../../../lib/dates";
import Avatar from "../avatar/Avatar";

/** Найз маань хэрэглэл хэрэгтэй байна — нэг товшилтоор хариулах карт */
export default function IncomingSosCard() {
  const { incoming, respond, replyText, friends } = useFriends();
  if (!incoming.length) return null;

  return (
    <div className="space-y-3">
      {incoming.map((r) => (
        <div key={r.id} className="relative overflow-hidden rounded-3xl p-4 border bb-border-F48FB1 bb-grad-9 shadow-sm bloom-pop">
          <div className="flex items-start gap-3">
            {(() => {
              // Sender's own avatar when she is in my friends list; otherwise the SOS badge.
              const sender = friends.find((friend) => friend.id === r.sender_id);
              return sender ? (
                <span className="relative w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <Avatar config={sender.avatar_config} look={sender.avatar_look} skin={sender.avatar_skin} headOnly size={40} label={`${r.sender_name}-ийн дүр`} />
                  <span className="absolute -bottom-0.5 -right-0.5 text-[11px]" aria-hidden="true">🆘</span>
                </span>
              ) : (
                <span className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center text-xl shrink-0 shadow-sm">🆘</span>
              );
            })()}
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
