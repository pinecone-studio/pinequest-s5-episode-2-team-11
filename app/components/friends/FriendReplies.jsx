"use client";

import { useFriends } from "../../../context/FriendsContext";

/** Миний илгээсэн SOS-д найзуудын ирүүлсэн хариу */
export default function FriendReplies() {
  const { outgoing, sosStage, replyText } = useFriends();
  if (!outgoing || sosStage === "ringing") return null;
  const list = outgoing.responses ?? [];

  if (!list.length) {
    return (
      <p className="text-xs font-bold text-slate-400 text-center py-1">Найзуудын хариуг хүлээж байна…</p>
    );
  }
  return (
    <div className="space-y-2">
      {list.map((r) => (
        <div
          key={r.responder_name + r.created_at}
          className={`flex items-center gap-3 rounded-2xl p-3 bloom-pop ${r.reply === "no" ? "bg-slate-50" : "bb-bg-FDE7F1"}`}
        >
          <span className="w-9 h-9 rounded-full bb-bg-E9DDFC bb-text-7C4DCC font-black flex items-center justify-center shrink-0">
            {r.responder_name.charAt(0)}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-slate-700">{r.responder_name}</p>
            <p className="text-sm font-semibold text-slate-600 leading-snug">{replyText(r.reply)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
