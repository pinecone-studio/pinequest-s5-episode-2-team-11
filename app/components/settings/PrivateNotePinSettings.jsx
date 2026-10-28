"use client";

import { useEffect, useState } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import { t } from "../../../lib/i18n";

async function requestPin(session, payload) {
  const response = await fetch("/api/private-notes", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || t("Хүсэлт амжилтгүй.", "Request failed."));
  return data;
}

export default function PrivateNotePinSettings() {
  const { session } = useFamily();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    try { const result = await requestPin(session, { action: "status" }); setEnabled(result.enabled); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (session) refresh(); }, [session?.access_token]);

  const submit = async (action) => {
    setError(""); setMessage("");
    if (action === "disable" && !/^\d{4,6}$/.test(currentPin)) return setError(t("Одоогийн PIN-ээ оруулна уу.", "Enter your current PIN."));
    if (action !== "disable" && !/^\d{4,6}$/.test(pin)) return setError(t("4–6 оронтой PIN оруулна уу.", "Enter a 4–6 digit PIN."));
    if (action !== "disable" && pin !== confirmPin) return setError(t("PIN давтаж оруулсан утгатай таарахгүй байна.", "The PINs don't match."));
    setBusy(true);
    try {
      if (action === "reset") await requestPin(session, { action, pin, password });
      else await requestPin(session, { action, pin: action === "disable" ? currentPin : pin });
      setEnabled(action !== "disable"); setPin(""); setConfirmPin(""); setPassword(""); setCurrentPin("");
      setMessage(action === "disable" ? t("PIN хамгаалалтыг унтраалаа.", "PIN protection turned off.") : t("Нууц тэмдэглэлийн PIN хадгалагдлаа.", "Private note PIN saved."));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (loading) return <Card className="p-3"><p className="text-xs font-bold text-slate-400">{t("Нууцлал ачаалж байна…", "Loading privacy…")}</p></Card>;

  return <Card className="space-y-3 p-3">
    <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bb-bg-FDE7F1"><LockKeyhole className="h-4 w-4 bb-text-B83B7E" /></span><h3 className="text-sm font-extrabold text-slate-700">{t("Нууц тэмдэглэлийн PIN", "Private note PIN")}</h3></div>
    <p className="text-xs font-semibold leading-5 text-slate-500">{t("Хувийн тэмдэглэлээ 4–6 оронтой PIN-ээр түгжээрэй. PIN-ээ мартвал аккаунтын нууц үгээр дахин тохируулна.", "Lock your private notes with a 4–6 digit PIN. If you forget it, reset it with your account password.")}</p>
    {!enabled && <PinFields pin={pin} confirmPin={confirmPin} setPin={setPin} setConfirmPin={setConfirmPin} />}
    {enabled && <>
      <p className="rounded-xl bb-bg-FDE7F1-50 px-3 py-2 text-xs font-extrabold bb-text-B83B7E">{t("PIN хамгаалалт асаалттай", "PIN protection is on")}</p>
      <input aria-label={t("Одоогийн PIN", "Current PIN")} inputMode="numeric" autoComplete="current-password" maxLength={6} value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))} placeholder={t("PIN унтраахын тулд одоогийн PIN", "Current PIN to turn it off")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2"><input aria-label={t("Шинэ PIN", "New PIN")} inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder={t("Шинэ PIN", "New PIN")} className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input aria-label={t("Шинэ PIN давтах", "Repeat new PIN")} inputMode="numeric" autoComplete="new-password" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} placeholder={t("Давтах", "Repeat")} className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div>
      <input aria-label={t("Аккаунтын нууц үг", "Account password")} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("Мартсан бол аккаунтын нууц үг", "Forgot it? Account password")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
    </>}
    {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}{message && <p role="status" className="text-xs font-bold text-emerald-700">{message}</p>}
    {!enabled ? <button type="button" disabled={busy} onClick={() => submit("set")} className="flex w-full items-center justify-center gap-2 rounded-xl bb-bg-E0679F py-2.5 text-sm font-extrabold text-white disabled:opacity-50"><KeyRound className="h-4 w-4" />{busy ? t("Хадгалж байна…", "Saving…") : t("PIN тохируулах", "Set PIN")}</button> : <div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy} onClick={() => submit("reset")} className="rounded-xl bb-bg-E0679F py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{busy ? t("Хадгалж байна…", "Saving…") : t("PIN шинэчлэх", "Update PIN")}</button><button type="button" disabled={busy} onClick={() => submit("disable")} className="rounded-xl bg-slate-100 py-2.5 text-xs font-extrabold text-slate-600 disabled:opacity-50">{t("PIN унтраах", "Turn off PIN")}</button></div>}
  </Card>;
}

function PinFields({ pin, confirmPin, setPin, setConfirmPin }) {
  return <div className="grid grid-cols-2 gap-2"><input aria-label="PIN" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder={t("Шинэ PIN", "New PIN")} className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input aria-label={t("PIN давтах", "Repeat PIN")} inputMode="numeric" autoComplete="new-password" maxLength={6} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))} placeholder={t("Давтах", "Repeat")} className="min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm" /></div>;
}
