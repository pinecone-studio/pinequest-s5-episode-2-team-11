"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { enablePush, pushStatus } from "../../../lib/push-client";
import { t } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import { Toggle } from "./SettingsList";

const DEFAULTS = { friends_enabled: true, guardian_enabled: true, reminders_enabled: true, diary_reminder: false };

const statusText = (status) => ({
  granted: t("Энэ утсан дээр мэдэгдэл асаалттай ✓", "Notifications are on for this device ✓"),
  denied: t("Мэдэгдэл хаагдсан байна. Утасныхаа тохиргооноос Bloomy-д зөвшөөрөл өгөөрэй.", "Notifications are blocked. Allow them for Bloomy in your device settings."),
  ios_install: t("iPhone дээр: Safari → Хуваалцах → «Нүүр дэлгэцэнд нэмэх», дараа нь тэндээс нээгээд асаагаарай.", "On iPhone: Safari → Share → Add to Home Screen, then open Bloomy from your Home Screen and enable notifications."),
  unsupported: t("Энэ хөтөч мэдэгдэл дэмжихгүй байна.", "This browser does not support notifications."),
})[status];

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
      setToast(t("Хадгалж чадсангүй. Дахин оролдоно уу.", "Could not save. Please try again."));
    }
  };

  const turnOn = async () => {
    setEnabling(true);
    const next = await enablePush(session).catch(() => "default");
    setEnabling(false);
    setStatus(next);
    if (next === "granted") setToast(t("Мэдэгдэл асаалаа 🔔", "Notifications enabled 🔔"));
  };

  return (
    <div className="space-y-2 pb-2">
      {status === "default" ? (
        <button type="button" onClick={turnOn} disabled={enabling} className="w-full rounded-2xl bb-bg-E0679F py-3 text-sm font-extrabold text-white disabled:opacity-60">
          {enabling ? t("Асааж байна…", "Enabling…") : t("🔔 Энэ утсан дээр мэдэгдэл асаах", "🔔 Enable notifications on this device")}
        </button>
      ) : (
        <p className={`rounded-2xl p-3 text-xs font-bold leading-relaxed ${status === "granted" ? "bb-bg-FDE7F1 bb-text-B83B7E" : "bg-slate-50 text-slate-500"}`}>{statusText(status)}</p>
      )}

      {!prefs ? <p className="py-4 text-center text-sm font-bold text-slate-400">{t("Ачаалж байна…", "Loading…")}</p> : (
        <>
          {isDaughter && (
            <div>
              <Toggle label={t("Найзуудын мэдэгдэл", "Friends' notifications")} checked={prefs.friends_enabled} onChange={(value) => update("friends_enabled", value)} />
              <p className="px-3 pt-1 text-[11px] font-semibold text-slate-400">{t("SOS мэдэгдэл үргэлж ирнэ", "SOS alerts will always be delivered.")}</p>
            </div>
          )}
          <Toggle label={t("Асран хамгаалагчийн мэдэгдэл", "Guardian notifications")} checked={prefs.guardian_enabled} onChange={(value) => update("guardian_enabled", value)} />
          <Toggle label={t("Сануулга", "Reminders")} checked={prefs.reminders_enabled} onChange={(value) => update("reminders_enabled", value)} />
          {isDaughter && <Toggle label={t("Тэмдэглэлийн сануулга", "Diary reminder")} hint={t("Орой 20:00-д", "At 8:00 PM")} checked={prefs.diary_reminder} onChange={(value) => update("diary_reminder", value)} />}
          <p className="px-1 pt-1 text-[11px] font-semibold text-slate-400">{t("Унтраасан ч мэдэгдэл хонхонд харагдсаар байна.", "Notifications will still appear in your inbox when turned off here.")}</p>
        </>
      )}
    </div>
  );
}
