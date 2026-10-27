"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { supabase } from "../../../lib/supabase";
import BottomSheet from "../ui/BottomSheet";

/**
 * Private note for one day. The text is stored in day_logs.note and only read
 * through /api/private-notes (PIN-checked when a PIN is set) — never through
 * log_entries, the timeline, or anything a guardian can call.
 */
export default function PrivateNoteSheet({ date, onClose }) {
  const { session, noteUnlockToken, unlockPrivateNotes, setToast } = useFamily();
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const post = (body, token) => fetch("/api/private-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}`, ...(token ? { "x-note-unlock-token": token } : {}) },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const fetchNote = async (token) => {
    const response = await post({ action: "note", date }, token);
    const result = await response.json();
    if (response.ok) setNote(result.note ?? "");
    else if (response.status === 423) setPinRequired(true);
    else setError(result.error || "Тэмдэглэл ачаалж чадсангүй.");
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await post({ action: "status", date });
        const lock = response.ok ? await response.json() : { enabled: false, hasNote: false };
        if (cancelled) return;
        setPinEnabled(Boolean(lock.enabled));
        const needsPin = Boolean(lock.enabled && lock.hasNote && !noteUnlockToken);
        setPinRequired(needsPin);
        if (!needsPin && lock.hasNote) await fetchNote(noteUnlockToken);
      } catch (e) {
        if (!cancelled) setError("Тэмдэглэл ачаалж чадсангүй.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, session?.access_token, noteUnlockToken]);

  const unlock = async (event) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pin) || busy) return;
    setBusy(true); setError("");
    try {
      const response = await post({ action: "verify", pin });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "PIN шалгаж чадсангүй.");
      unlockPrivateNotes(result.token);
      setPinRequired(false); setPin("");
      await fetchNote(result.token);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (busy) return;
    setBusy(true); setError("");
    const { error: saveError } = await supabase.rpc("save_my_day_note", { p_log_date: date, p_note: note.trim() || null });
    setBusy(false);
    if (saveError) {
      console.error("[day_logs] note:", saveError);
      setToast("Хадгалж чадсангүй. Дахин оролдоно уу.");
      return;
    }
    setToast("Хадгаллаа");
    onClose();
  };

  return (
    <BottomSheet title="🔒 Нууц тэмдэглэл" onClose={onClose} layer={90}>
      {loading ? (
        <p className="py-6 text-center text-sm font-bold text-slate-400">Ачаалж байна…</p>
      ) : pinRequired ? (
        <form onSubmit={unlock} className="space-y-2 pb-2">
          <p className="text-xs font-semibold text-slate-500">Хадгалсан тэмдэглэлээ үзэхийн тулд PIN-ээ оруулна уу.</p>
          <div className="flex gap-2">
            <input aria-label="Нууц тэмдэглэлийн PIN" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="PIN" />
            <button type="submit" disabled={busy} className="rounded-xl bb-bg-E0679F px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">{busy ? "Шалгаж байна…" : "Нээх"}</button>
          </div>
          {error && <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>}
        </form>
      ) : (
        <div className="space-y-2 pb-2">
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={4} placeholder="Өөр юу болсон бэ?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-pink-300" />
          <p className="text-xs font-semibold text-slate-400">{pinEnabled ? "PIN-ээр хамгаалагдсан. Зөвхөн чамд харагдана." : "Зөвхөн чамд харагдана"}</p>
          {error && <p role="alert" className="text-sm font-bold text-rose-600">{error}</p>}
          <button type="button" onClick={save} disabled={busy || Boolean(error)} className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white disabled:opacity-60">{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
        </div>
      )}
    </BottomSheet>
  );
}
