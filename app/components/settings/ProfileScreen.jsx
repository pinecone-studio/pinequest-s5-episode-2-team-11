"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import BottomSheet from "../ui/BottomSheet";
import { RotateCcw } from "lucide-react";
import { useOnboarding } from "../../../context/OnboardingContext";
import Card from "../ui/Card";
import DaughterProfile from "./DaughterProfile";
import FamilyLinkingSection from "./FamilyLinkingSection";
import NotificationSettings from "./NotificationSettings";
import { SettingsGroup, SettingsRow } from "./SettingsList";
import ProfileCard from "./ProfileCard";
import { APP_SETTINGS_FOCUS_EVENT, takeAppSettingsFocus } from "./appSettingsFocus";
import { t } from "../../../lib/i18n";

export default function ProfileScreen() {
  const { view, signOut } = useFamily();
  const { openTutorial } = useOnboarding();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isMother = view === "mother";

  useEffect(() => {
    const focusApp = () => {
      if (!takeAppSettingsFocus()) return;
      requestAnimationFrame(() => document.getElementById("app")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    focusApp();
    window.addEventListener(APP_SETTINGS_FOCUS_EVENT, focusApp);
    return () => window.removeEventListener(APP_SETTINGS_FOCUS_EVENT, focusApp);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black leading-tight text-slate-700 bloom-fade">{t("Профайл", "Profile")}</h2>

      {!isMother ? (
        <DaughterProfile mode="profile" />
      ) : (
        <>
          <ProfileCard />
          <FamilyLinkingSection />
          <SettingsGroup>
            <SettingsRow emoji="🔔" label={t("Мэдэгдэл", "Notifications")} onClick={() => setNotificationsOpen(true)} />
          </SettingsGroup>
          {notificationsOpen && <BottomSheet title={t("🔔 Мэдэгдэл", "🔔 Notifications")} onClose={() => setNotificationsOpen(false)}><NotificationSettings /></BottomSheet>}
        </>
      )}
      <Card className="!p-3">
        <button
          type="button"
          onClick={openTutorial}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          aria-label="Bloomy зааврыг дахин үзэх"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bb-bg-FDE7F1 bb-text-B83B7E">
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-slate-700">Заавар дахин үзэх</span>
            <span className="mt-0.5 block text-xs font-semibold text-slate-500">Bloomy-ийн танилцуулгыг дахин нээх</span>
          </span>
        </button>
      </Card>
    </div>
  );
}

