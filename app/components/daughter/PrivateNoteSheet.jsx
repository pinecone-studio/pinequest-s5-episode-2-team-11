"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { supabase } from "../../../lib/supabase";
import { t } from "../../../lib/i18n";

const formatDiaryDate = (date) => {
  const [year, month, day] = date.split("-").map(Number);
  return t(`${year} оны ${month} сарын ${day}`, new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day)));
};

/** PIN-protected personal note for a selected calendar day. */
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
    body: JSON.stringify(body), cache: "no-store",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await post({ action: "status", date });
        const status = response.ok ? await response.json() : { enabled: false, hasNote: false };
        if (cancelled) return;
        setPinEnabled(Boolean(status.enabled));
        const needsPin = Boolean(status.enabled && status.hasNote && !noteUnlockToken);
        setPinRequired(needsPin);
        if (!needsPin && status.hasNote) {
          const response = await post({ action: "note", date }, noteUnlockToken);
          const result = await response.json();
          if (!cancelled && response.ok) setNote(result.note ?? "");
          else if (!cancelled && response.status === 423) setPinRequired(true);
        }
      } catch (loadError) {
        if (!cancelled) console.warn("[private-notes] existing note could not be loaded:", loadError);
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
      if (!response.ok) throw new Error(result.error || t("PIN шалгаж чадсангүй.", "Couldn't check the PIN."));
      unlockPrivateNotes(result.token);
      setPinRequired(false); setPin("");
      const noteResponse = await post({ action: "note", date }, result.token);
      const noteResult = await noteResponse.json();
      if (!noteResponse.ok) throw new Error(noteResult.error || t("Тэмдэглэл ачаалж чадсангүй.", "Couldn't load the note."));
      setNote(noteResult.note ?? "");
    } catch (unlockError) { setError(unlockError.message); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (busy || loading || pinRequired) return;
    setBusy(true); setError("");
    try {
      const { error: saveError } = await supabase.rpc("save_my_day_note", { p_log_date: date, p_note: note.trim() || null });
      if (saveError) throw saveError;
      setToast(t("Тэмдэглэл хадгаллаа", "Diary entry saved"));
      onClose();
    } catch (saveError) {
      console.error("[day_logs] note:", saveError);
      setError(t("Хадгалж чадсангүй. Supabase-ийн log-entries migration-ийг шалгана уу.", "Couldn't save. Check the Supabase log-entries migration."));
      setToast(t("Хадгалж чадсангүй. Дахин оролдоно уу.", "Couldn't save. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const close = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <div className="diary-overlay" style={{ zIndex: 120 }} onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={t("Өдрийн тэмдэглэл", "Daily diary")} onClick={(event) => event.stopPropagation()} className="diary-dialog">
        <div className="diary-book">
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={close} aria-label={t("Хаах", "Close")} className="diary-close"><X className="h-5 w-5" /></button>
          <time className="diary-date" dateTime={date}>{formatDiaryDate(date)}</time>
          {loading ? <p className="diary-status">{t("Ачаалж байна…", "Loading…")}</p> : pinRequired ? (
            <form onSubmit={unlock} className="diary-pin-form">
              <p>{t("Өмнөх тэмдэглэлээ нээхийн тулд PIN-ээ оруулна уу.", "Enter your PIN to open this saved entry.")}</p>
              <input aria-label="PIN" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} placeholder="PIN" />
              <button type="submit" disabled={busy}>{busy ? t("Шалгаж байна…", "Checking…") : t("Нээх", "Open")}</button>
            </form>
          ) : (
            <textarea autoFocus value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder={t("Энд дарж бичээрэй…", "Tap here and start writing…")} aria-label={t("Өдрийн тэмдэглэлээ бичих", "Write your diary entry")} />
          )}
          {error && <p role="alert" className="diary-error">{error}</p>}
        </div>
        <footer className="diary-footer">
          <span>{t("500 хүртэлх тэмдэгт", "Up to 500 characters")}{pinEnabled ? ` · ${t("PIN хамгаалалттай", "PIN protected")}` : ` · ${t("Зөвхөн чамд харагдана", "Only you can see this")}`}</span>
          <button type="button" onClick={save} disabled={busy || loading || pinRequired} className="diary-save">{busy ? t("Хадгалж байна…", "Saving…") : t("Хадгалах", "Save entry")}</button>
        </footer>
      </section>
    </div>
  );
}
