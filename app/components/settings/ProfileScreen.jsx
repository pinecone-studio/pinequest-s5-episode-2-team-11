"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import BottomSheet from "../ui/BottomSheet";
import { RotateCcw } from "lucide-react";
import { useOnboarding } from "../../../context/OnboardingContext";
import Card from "../ui/Card";
import AppSettingsSection from "./AppSettingsSection";
import DaughterProfile, { DeleteAccountSheet } from "./DaughterProfile";
import FamilyLinkingSection from "./FamilyLinkingSection";
import NotificationSettings from "./NotificationSettings";
import { SettingsGroup, SettingsRow } from "./SettingsList";
import ProfileCard from "./ProfileCard";
import { APP_SETTINGS_FOCUS_EVENT, takeAppSettingsFocus } from "./appSettingsFocus";
import { t } from "../../../lib/i18n";

export default function ProfileScreen() {
  const { view, signOut } = useFamily();
  const { openTutorial } = useOnboarding();
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
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
        <>
          <DaughterProfile mode="profile" />
          <button
            type="button"
            onClick={() => setDeleteAccountOpen(true)}
            className="w-full rounded-2xl border border-slate-100 bg-white py-3 text-center text-sm font-extrabold text-rose-600 transition active:scale-95"
          >
            {t("Бүртгэл устгах", "Delete account")}
          </button>
          {deleteAccountOpen && <DeleteAccountSheet onClose={() => setDeleteAccountOpen(false)} />}
          <SignOutButton onConfirm={signOut} />
        </>
      ) : (
        <>
          <ProfileCard />
          <FamilyLinkingSection />
          <SettingsGroup>
            <SettingsRow emoji="🔔" label={t("Мэдэгдэл", "Notifications")} onClick={() => setNotificationsOpen(true)} />
          </SettingsGroup>
          {notificationsOpen && <BottomSheet title={t("🔔 Мэдэгдэл", "🔔 Notifications")} onClose={() => setNotificationsOpen(false)}><NotificationSettings /></BottomSheet>}
          <AppSettingsSection />
          <SignOutButton onConfirm={signOut} />
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

/** «Гарах» — охин, асран хамгаалагч хоёуланд ижил харагдана. Дарахад баталгаажуулалт асууна. */
function SignOutButton({ onConfirm }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-slate-100 bg-white py-3 text-center text-sm font-extrabold text-rose-600 transition active:scale-95"
      >
        {t("Гарах", "Sign out")}
      </button>
      {open && (
        <BottomSheet title={t("Гарах", "Sign out")} onClose={() => setOpen(false)}>
          <div className="space-y-3 pb-2">
            <p className="text-base font-black text-slate-700">{t("Гарахдаа итгэлтэй байна уу?", "Are you sure you want to sign out?")}</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">{t("Болих", "Cancel")}</button>
              <button type="button" onClick={() => { setOpen(false); onConfirm(); }} className="rounded-2xl bg-rose-500 py-3 text-sm font-extrabold text-white">{t("Гарах", "Sign out")}</button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
