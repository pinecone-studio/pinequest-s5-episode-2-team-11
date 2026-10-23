"use client";

import { useFriends } from "../../../context/FriendsContext";

/** Миний илгээсэн SOS-д найзуудын ирүүлсэн хариу */
export default function FriendReplies() {
  const { outgoing, sosStage, replyText } = useFriends();
  if (!outgoing || sosStage === "ringing") return null;
  const list = outgoing.responses ?? [];

  if (!list.length) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bb-bg-FFF7FB px-3 py-3 text-xs font-bold text-slate-400"><span className="w-2 h-2 rounded-full bb-bg-F48FB1 animate-pulse" /> Найзуудын хариуг хүлээж байна…</div>
    );
  }
  return (
    <div className="space-y-2">
      {list.map((r) => (
        <div
          key={r.responder_name + r.created_at}
          className={`flex items-center gap-3 rounded-2xl border p-3 bloom-pop ${r.reply === "no" ? "bg-slate-50 border-slate-100" : "bb-bg-FDE7F1 border-transparent"}`}
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
