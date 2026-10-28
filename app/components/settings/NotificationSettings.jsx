"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { enablePush, pushStatus } from "../../../lib/push-client";
import { supabase } from "../../../lib/supabase";
import { Toggle } from "./SettingsList";

const DEFAULTS = { friends_enabled: true, guardian_enabled: true, reminders_enabled: true, diary_reminder: false };

const STATUS_TEXT = {
  granted: "Энэ утсан дээр мэдэгдэл асаалттай ✓",
  denied: "Мэдэгдэл хаагдсан байна. Утасныхаа тохиргооноос Bloomy-д зөвшөөрөл өгөөрэй.",
  ios_install: "iPhone дээр: Safari → Хуваалцах → «Нүүр дэлгэцэнд нэмэх», дараа нь тэндээс нээгээд асаагаарай.",
  unsupported: "Энэ хөтөч мэдэгдэл дэмжихгүй байна.",
};

/** Profile → «🔔 Мэдэгдэл»: this device's push permission + notification_prefs toggles. */
export default function NotificationSettings() {
  const { profile, session, view, setToast } = useFamily();
  const isDaughter = view === "daughter";
  const [prefs, setPrefs] = useState(null);
  const [status, setStatus] = useState("default");
  const [enabling, setEnabling] = useState(false);

  useEffect(() => { setStatus(pushStatus()); }, []);

  useEffect(() => {
    if (!supabase || !profile?.id) return;
    let cancelled = false;
    supabase.from("notification_prefs").select("*").eq("user_id", profile.id).maybeSingle().then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.warn("[prefs]", error.message);
      setPrefs({ ...DEFAULTS, ...(data ?? {}) });
    });
    return () => { cancelled = true; };
  }, [profile?.id]);

  const update = async (key, value) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await supabase.from("notification_prefs").upsert({
      user_id: profile.id, friends_enabled: next.friends_enabled, guardian_enabled: next.guardian_enabled,
      reminders_enabled: next.reminders_enabled, diary_reminder: next.diary_reminder, updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[prefs] save:", error);
      setPrefs(previous);
      setToast("Хадгалж чадсангүй. Дахин оролдоно уу.");
    }
  };

  const turnOn = async () => {
    setEnabling(true);
    const next = await enablePush(session).catch(() => "default");
    setEnabling(false);
    setStatus(next);
    if (next === "granted") setToast("Мэдэгдэл асаалаа 🔔");
  };

  return (
    <div className="space-y-2 pb-2">
      {status === "default" ? (
        <button type="button" onClick={turnOn} disabled={enabling} className="w-full rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white disabled:opacity-60">
          {enabling ? "Асааж байна…" : "🔔 Энэ утсан дээр мэдэгдэл асаах"}
        </button>
      ) : (
        <p className={`rounded-2xl p-3 text-xs font-bold leading-relaxed ${status === "granted" ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bg-slate-50 text-slate-500"}`}>{STATUS_TEXT[status]}</p>
      )}

      {!prefs ? <p className="py-4 text-center text-sm font-bold text-slate-400">Ачаалж байна…</p> : (
        <>
          {isDaughter && (
            <div>
              <Toggle label="Найзуудын мэдэгдэл" checked={prefs.friends_enabled} onChange={(value) => update("friends_enabled", value)} />
              <p className="px-3 pt-1 text-[11px] font-semibold text-slate-400">SOS мэдэгдэл үргэлж ирнэ</p>
            </div>
          )}
          <Toggle label="Асран хамгаалагчийн мэдэгдэл" checked={prefs.guardian_enabled} onChange={(value) => update("guardian_enabled", value)} />
          <Toggle label="Сануулга" checked={prefs.reminders_enabled} onChange={(value) => update("reminders_enabled", value)} />
          {isDaughter && <Toggle label="Тэмдэглэлийн сануулга" hint="Орой 20:00-д" checked={prefs.diary_reminder} onChange={(value) => update("diary_reminder", value)} />}
          <p className="px-1 pt-1 text-[11px] font-semibold text-slate-400">Унтраасан ч мэдэгдэл хонхонд харагдсаар байна.</p>
        </>
      )}
    </div>
  );
}
