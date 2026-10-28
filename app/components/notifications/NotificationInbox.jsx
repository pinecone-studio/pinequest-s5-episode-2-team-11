"use client";

import { useMemo } from "react";
import { EVENTS } from "../../../lib/notificationEvents";
import { relativeTimeMn } from "../../../lib/relative-time";
import BottomSheet from "../ui/BottomSheet";

const LEGACY_ICON = { sos: "🆘", supply: "🛍️", period: "🌸", join: "🔗", care: "💌", kit: "🎒" };
const iconOf = (row) => EVENTS[row.event]?.icon ?? LEGACY_ICON[row.kind] ?? "🔔";

/** Bell inbox: urgent unread pinned on top, then newest first. */
export default function NotificationInbox({ inbox, onOpen, onClose }) {
  const { rows, unread, markRead, markAllRead } = inbox;
  const sorted = useMemo(() => {
    const pinned = rows.filter((row) => row.priority === "urgent" && !row.read);
    return [...pinned, ...rows.filter((row) => !pinned.includes(row))];
  }, [rows]);

  const open = async (row) => {
    if (!row.read) await markRead(row.id);
    onOpen(row.url || null);
  };

  return (
    <BottomSheet
      title="Мэдэгдэл"
      onClose={onClose}
      aside={unread > 0 ? <button type="button" onClick={markAllRead} className="rounded-full bb-bg-FDE7F1 px-3 py-1.5 text-xs font-extrabold bb-text-B83B7E">Бүгдийг уншсан</button> : null}
    >
      {!sorted.length ? (
        <p className="py-10 text-center text-sm font-bold text-slate-400">Одоогоор мэдэгдэл алга 🌸</p>
      ) : (
        <ul className="space-y-2 pb-2">
          {sorted.map((row) => {
            const headline = row.body || row.text;
            const detail = row.text && row.text !== headline ? row.text : null;
            const pinned = row.priority === "urgent" && !row.read;
            return (
              <li key={row.id}>
                <button type="button" onClick={() => open(row)} className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${row.read ? "bg-white" : "bb-bg-FDE7F1-50"} ${pinned ? "ring-2 ring-rose-300" : ""}`}>
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">{iconOf(row)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold leading-snug text-slate-700">{headline}</span>
                    {detail && <span className="mt-0.5 line-clamp-2 block text-xs font-semibold leading-snug text-slate-500">{detail}</span>}
                    <span className="mt-1 block text-[11px] font-bold text-slate-400">{relativeTimeMn(row.created_at)}</span>
                  </span>
                  {!row.read && <span aria-label="Уншаагүй" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bb-bg-E0679F" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
}
