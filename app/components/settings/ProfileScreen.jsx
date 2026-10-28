"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import BottomSheet from "../ui/BottomSheet";
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
  const { view, guardianGender, updateGuardianGender, signOut } = useFamily();
  const [savingGender, setSavingGender] = useState(false);
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
          <Card className="!p-4">
            <h2 className="text-sm font-black text-slate-700">{t("Танд тохирох зөвлөгөө", "Tips for you")}</h2>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
              {t("Энэ мэдээлэл зөвхөн таны зөвлөгөөг тохируулахад ашиглагдана.", "This is only used to tailor your tips.")}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {[
                { value: "female", label: t("Эмэгтэй", "Female") },
                { value: "male", label: t("Эрэгтэй", "Male") },
                { value: "unspecified", label: t("Хэлэхгүй байя", "Prefer not to say") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={guardianGender === option.value}
                  disabled={savingGender || guardianGender == null}
                  onClick={async () => {
                    if (guardianGender === option.value) return;
                    setSavingGender(true);
                    try {
                      await updateGuardianGender(option.value);
                    } finally {
                      setSavingGender(false);
                    }
                  }}
                  className={`min-h-11 rounded-xl border px-4 py-2 text-left text-sm font-extrabold transition disabled:opacity-60 ${
                    guardianGender === option.value ? "border-pink-300 bb-bg-FDE7F1 bb-text-B83B7E" : "border-slate-100 bg-white text-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {savingGender && <p role="status" className="mt-2 text-xs font-semibold text-slate-500">{t("Хадгалж байна…", "Saving…")}</p>}
          </Card>
          <FamilyLinkingSection />
          <SettingsGroup>
            <SettingsRow emoji="🔔" label={t("Мэдэгдэл", "Notifications")} onClick={() => setNotificationsOpen(true)} />
          </SettingsGroup>
          {notificationsOpen && <BottomSheet title={t("🔔 Мэдэгдэл", "🔔 Notifications")} onClose={() => setNotificationsOpen(false)}><NotificationSettings /></BottomSheet>}
          <AppSettingsSection />
          <SignOutButton onConfirm={signOut} />
        </>
      )}
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
