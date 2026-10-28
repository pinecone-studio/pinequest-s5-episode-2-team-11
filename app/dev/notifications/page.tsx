"use client";

/**
 * DEV ONLY: trigger any notification event for a chosen user, simulate the
 * Ulaanbaatar time, run the cron steps, and see the rows. The API answers 404
 * in production. You must be signed in (any account) for the app shell to stay here.
 */
import { useEffect, useState } from "react";

type EventInfo = { name: string; priority: string; audience: string; body: string };

const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700";
const button = "rounded-xl px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50";

export default function DevNotificationsPage() {
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [event, setEvent] = useState("friend_sos");
  const [detail, setDetail] = useState("");
  const [ubTime, setUbTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");

  const call = async (payload: Record<string, unknown>) => {
    setBusy(true);
    // datetime-local is read as Ulaanbaatar time (UTC+8).
    const now = ubTime ? new Date(`${ubTime}:00+08:00`).toISOString() : undefined;
    const response = await fetch("/api/dev/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ now, to, from, ...payload }) });
    const text = await response.text();
    setBusy(false);
    try { return JSON.parse(text); } catch { return { status: response.status, text }; }
  };

  useEffect(() => {
    call({ action: "events" }).then((result) => setEvents(result.events ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (payload: Record<string, unknown>) => setOutput(JSON.stringify(await call(payload), null, 2));

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto bg-white p-4 text-slate-700">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-black">🔔 Мэдэгдэл тест (dev)</h1>
        <label className="block text-xs font-extrabold">Хүлээн авагч (имэйл эсвэл id)
          <input className={field} value={to} onChange={(e) => setTo(e.target.value)} placeholder="girl@example.com" />
        </label>
        <label className="block text-xs font-extrabold">Илгээгч (заавал биш — нэр, rate limit-д)
          <input className={field} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="friend@example.com" />
        </label>
        <label className="block text-xs font-extrabold">Event
          <select className={field} value={event} onChange={(e) => setEvent(e.target.value)}>
            {events.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.priority} · {item.body}</option>)}
          </select>
        </label>
        <label className="block text-xs font-extrabold">Апп доторх дэлгэрэнгүй (заавал биш)
          <input className={field} value={detail} onChange={(e) => setDetail(e.target.value)} />
        </label>
        <label className="block text-xs font-extrabold">Одоогийн цаг (Улаанбаатар; хоосон = жинхэнэ цаг)
          <input type="datetime-local" className={field} value={ubTime} onChange={(e) => setUbTime(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || !to} onClick={() => run({ event, detail: detail || null })} className={`${button} bg-pink-500`}>Илгээх</button>
          <button type="button" disabled={busy} onClick={() => run({ action: "deliver" })} className={`${button} bg-violet-500`}>Cron: хугацаа болсныг илгээх</button>
          <button type="button" disabled={busy} onClick={() => run({ action: "reminders" })} className={`${button} bg-violet-500`}>Cron: сануулга үүсгэх</button>
          <button type="button" disabled={busy || !to} onClick={() => run({ action: "list" })} className={`${button} bg-slate-500`}>Сүүлийн мөрүүд</button>
        </div>
        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-[11px] text-slate-100">{output || "…"}</pre>
      </div>
    </div>
  );
}
