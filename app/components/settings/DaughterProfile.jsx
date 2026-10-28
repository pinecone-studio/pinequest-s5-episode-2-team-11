"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
import { t } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import { useAvatar } from "../avatar/useAvatar";
import DaughterSupplies from "../daughter/DaughterSupplies";
import { Stepper } from "../onboarding/CycleSetup";
import BottomSheet from "../ui/BottomSheet";
import { LANGUAGES, SegmentedChoice, THEMES, useLanguage } from "./AppSettingsSection";
import SafetyCard from "../safety/SafetyCard";
import GuardianConnectForm from "./GuardianConnectForm";
import NotificationSettings from "./NotificationSettings";
import PrivateNotePinSettings from "./PrivateNotePinSettings";
import ProfileCard from "./ProfileCard";
import { ComingSoon, SettingsGroup, SettingsRow, Toggle } from "./SettingsList";

const FAQ = [
  ["Сарын тэмдгээ яаж тэмдэглэх вэ?", "How do I log a period?", "Өнөөдөр хуудсан дээрх «🩸 Сарын тэмдэг маань өнөөдөр ирлээ» товчийг дар. Өөр өдрийг Хуанли дээрээс тухайн өдөр дээр дараад «💧 Сарын тэмдэг»-ээр тэмдэглэнэ.", "Tap “🩸 My period started today” on the Today page. To log another day, choose it in Calendar and tap “💧 Period”."],
  ["Найзаа яаж нэмэх вэ?", "How do I add a friend?", "Найзууд хэсэгт «Найз нэмэх»-ийг дар. Тэнд чиний найзын код харагдана. Найзынхаа кодыг оруулаад нэмээрэй.", "Tap “Add friend” in Friends. Enter your friend's code to add them."],
  ["Миний тэмдэглэлийг хэн харах вэ?", "Who can see my notes?", "Зөвхөн чи. Нууц тэмдэглэлийг асран хамгаалагч ч, найзууд ч харахгүй.", "Only you. Guardians and friends cannot see your private notes."],
  ["Асран хамгаалагч маань юу харах вэ?", "What can my guardian see?", "Зөвхөн чиний зөвшөөрсөн зүйлийг. Жишээ нь «Сэтгэл санаа харах»-ыг асаасан бол сэтгэл санааг чинь харна. Үүнийг Профайл → Гэр бүл хэсгээс өөрчилнө.", "Only what you allow. For example, if “View mood” is on, your guardian can see your mood. Change this in Profile → Family."],
  ["Бидэнтэй яаж холбогдох вэ?", "How can I contact you?", "Асран хамгаалагчаараа дамжуулан бидэнд бичээрэй. Холбоо барих хаяг удахгүй энд нэмэгдэнэ.", "Ask your guardian to contact us. Our contact details will be added here soon."],
];

const POLICY = [
  ["Бид юу хадгалдаг вэ?", "What do we store?", "Нэр, имэйл, мөчлөгийн огноо, өдрийн тэмдэглэл (сэтгэл санаа, шинж тэмдэг, арьс, нойр), нууц тэмдэглэл, найзуудын жагсаалт.", "Your name, email, cycle dates, diary entries (mood, symptoms, skin, and sleep), private notes, and friends list."],
  ["Асран хамгаалагч юу харах вэ?", "What can my guardian see?", "Зөвхөн чиний зөвшөөрсөн зүйлийг. Чи хүссэн үедээ хуваалцахаа унтрааж болно.", "Only what you choose to share. You can turn sharing off at any time."],
  ["Нууц тэмдэглэл", "Private notes", "Зөвхөн чамд харагдана. PIN тавьж түгжиж болно.", "Only you can see your private notes. You can lock them with a PIN."],
  ["Бид мэдээллийг зардаг уу?", "Do we sell data?", "Үгүй. Бид чиний мэдээллийг хэзээ ч зарахгүй, сурталчилгаанд ашиглахгүй.", "No. We never sell your data or use it for advertising."],
  ["Бүртгэлээ устгах", "Delete your account", "Устгах хүсэлт илгээж болно. Асран хамгаалагч чинь баталгаажуулсны дараа бүх мэдээлэл устна.", "You can request account deletion. Your data will be deleted after your guardian approves."],
];

const localizedQuestions = (items) => items.map(([questionMn, questionEn, answerMn, answerEn]) => [
  t(questionMn, questionEn),
  t(answerMn, answerEn),
]);

function MyCycleSheet({ onClose }) {
  const { cycleLength, periodLength, periodStarts, lastPeriodStart, saveCycle, setToast } = useFamily();
  const [cycle, setCycle] = useState(cycleLength ?? 28);
  const [period, setPeriod] = useState(periodLength ?? 5);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    // Same call as the calendar's cycle settings sheet.
    const ok = await saveCycle({ lastPeriodStart: periodStarts?.at(-1) ?? lastPeriodStart ?? null, cycleLength: cycle, periodLength: period });
    setBusy(false);
    if (ok) { setToast(t("Хадгаллаа", "Saved")); onClose(); }
  };
  return (
    <BottomSheet title={t("📅 Миний мөчлөг", "📅 My cycle")} onClose={onClose}>
      <div className="space-y-5 pb-2">
        <Stepper id="profile-period-length" label={t("Сарын тэмдэг ойролцоогоор хэд хоног үргэлжилдэг вэ?", "About how many days does your period last?")} hint={t("Ихэвчлэн 3–7 хоног.", "Usually 3–7 days.")} value={period} setValue={setPeriod} min={2} max={7} />
        <Stepper id="profile-cycle-length" label={t("Мөчлөг ойролцоогоор хэд хоног вэ?", "About how many days is your cycle?")} hint={t("Өсвөр насанд 21–45 хоног хэвийн. Мэдэхгүй бол 28 хэвээр нь үлдээгээрэй.", "For teens, 21–45 days can be normal. If you are unsure, leave it at 28.")} value={cycle} setValue={setCycle} min={15} max={60} />
        <button type="button" onClick={save} disabled={busy} className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white disabled:opacity-60">{busy ? t("Хадгалж байна…", "Saving…") : t("Хадгалах", "Save")}</button>
      </div>
    </BottomSheet>
  );
}

function GuardianSheet({ onClose }) {
  const { guardianName, shareWithMom, setShareWithMom } = useFamily();
  return (
    <BottomSheet title={`${t("💗 Асран хамгаалагч", "💗 Guardian")} · ${guardianName || t("Холбогдсон", "Connected")}`} onClose={onClose}>
      <div className="space-y-2 pb-2">
        <p className="px-1 pb-1 text-xs font-semibold text-slate-500">{t("Асран хамгаалагч чинь юу харахыг чи шийднэ.", "You choose what your guardian can see.")}</p>
        <Toggle label={t("Сэтгэл санаа харах", "View mood")} hint={t("Хуваалцахаар сонгосон өдрийн сэтгэл санаа л харагдана", "Only moods from days you choose to share are visible.")} checked={Boolean(shareWithMom)} onChange={(value) => setShareWithMom(value)} />
        {/* TODO: no per-guardian backend yet for these three. */}
        <Toggle label={t("Календарь харах", "View calendar")} hint={t("Удахгүй", "Coming soon")} checked disabled onChange={() => {}} />
        <Toggle label={t("Хэрэглэлийн хүсэлт авах", "Receive supply requests")} hint={t("Удахгүй", "Coming soon")} checked disabled onChange={() => {}} />
        <Toggle label={t("Дохио авах", "Receive alerts")} hint={t("Удахгүй", "Coming soon")} checked disabled onChange={() => {}} />
        <p className="px-1 pt-1 text-[11px] font-semibold text-slate-400">{t("Холболтыг зөвхөн асран хамгаалагч өөрийн апп-аас салгана.", "Only your guardian can unlink from their app.")}</p>
      </div>
    </BottomSheet>
  );
}

export function DeleteAccountSheet({ onClose }) {
  const { linked, setToast } = useFamily();
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const send = async () => {
    if (!understood || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("request_my_account_deletion");
    setBusy(false);
    if (error) {
      console.error("[account] deletion request:", error);
      setToast(t("Хүсэлт илгээж чадсангүй. Дахин оролдоно уу.", "Could not send request. Please try again."));
      return;
    }
    setSent(true);
  };
  return (
    <BottomSheet title={t("Бүртгэл устгах", "Delete account")} onClose={onClose}>
      {sent ? (
        <div className="space-y-3 pb-2">
          <p className="rounded-2xl bb-bg-FDE7F1 p-4 text-sm font-bold bb-text-B83B7E">
            {linked ? t("Хүсэлт илгээгдлээ. Асран хамгаалагч чинь баталгаажуулна.", "Request sent. Your guardian will approve it.") : t("Хүсэлт илгээгдлээ.", "Request sent.")}
          </p>
          <button type="button" onClick={onClose} className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">{t("Хаах", "Close")}</button>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            {t("Бүртгэл устгавал мөчлөг, өдрийн тэмдэглэл, нууц тэмдэглэл, найзууд, дүр зэрэг", "Deleting your account will permanently erase your cycle data, diary entries, private notes, friends, avatar, and")} <b>{t("бүх мэдээлэл устана", "all other data")}</b>{t(". Буцааж сэргээх боломжгүй.", ". This cannot be undone.")}
          </p>
          <p className="text-xs font-semibold text-slate-500">{t("Асран хамгаалагч чинь баталгаажуулсны дараа устгана.", "Your guardian must approve before the data is deleted.")}</p>
          <label className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-500" />
            {t("Бүх мэдээлэл устахыг ойлгосон", "I understand all my data will be deleted")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">{t("Болих", "Cancel")}</button>
            <button type="button" onClick={send} disabled={!understood || busy} className="rounded-2xl bg-rose-500 py-3 text-sm font-extrabold text-white disabled:opacity-40">{busy ? t("Илгээж байна…", "Sending…") : t("Устгах хүсэлт илгээх", "Send deletion request")}</button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function QaList({ items }) {
  return (
    <div className="space-y-2 pb-2">
      {items.map(([question, answer]) => (
        <details key={question} className="rounded-2xl bg-white p-3 shadow-sm">
          <summary className="cursor-pointer text-sm font-extrabold text-slate-700">{question}</summary>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">{answer}</p>
        </details>
      ))}
    </div>
  );
}

/** Daughter's Profile tab as a grouped settings list (Settings page merged in as «Апп»). */
export default function DaughterProfile({ mode = "profile" }) {
  const { profile, setToast, linked, guardianName, cycleLength } = useFamily();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useLanguage();
  const avatar = useAvatar(profile?.id, setToast);
  const [sheet, setSheet] = useState(null);
  const showProfile = mode === "profile";
  const showSettings = mode === "settings";
  const close = () => setSheet(null);
  const subtitle = avatar.loaded ? `${t("Түв.", "Lv.")} ${avatar.level} · 🌸 ${avatar.petals}` : null;

  return (
    <div className="space-y-5">
      {showProfile && <ProfileCard compact subtitle={subtitle} />}

      <SettingsGroup title={t("Миний зүйлс", "My things")}>
        <SettingsRow emoji="🎒" label={t("Миний цүнх", "My bag")} onClick={() => setSheet("bag")} />
        <SettingsRow emoji="🎁" label={t("Миний хүслүүд", "My wishes")} value={t("Удахгүй", "Coming soon")} onClick={() => setSheet("wishes")} />
        <SettingsRow emoji="📅" label={t("Миний мөчлөг", "My cycle")} value={cycleLength ? t(`${cycleLength} хоног`, `${cycleLength} days`) : null} onClick={() => setSheet("cycle")} />
      </SettingsGroup>

      <SettingsGroup title={t("Гэр бүл", "Family")}>
        {linked
          ? <SettingsRow emoji="💗" label={`${t("Асран хамгаалагч", "Guardian")} · ${guardianName || t("Холбогдсон", "Connected")}`} onClick={() => setSheet("guardian")} />
          : <SettingsRow emoji="🔗" label={t("Асран хамгаалагчтай холбогдох", "Connect to a guardian")} onClick={() => setSheet("connect")} />}
        {/* TODO: «➕ Асран хамгаалагч нэмэх» — a family has one guardian (families.created_by) today. */}
      </SettingsGroup>

      <SettingsGroup title={t("Нууцлал", "Privacy")}>
        <SettingsRow emoji="🔒" label={t("Нууц тэмдэглэлийн түгжээ", "Private note lock")} onClick={() => setSheet("pin")} />
        <SettingsRow emoji="🔔" label={t("Мэдэгдэл", "Notifications")} onClick={() => setSheet("notifications")} />
      </SettingsGroup>

      <SettingsGroup id="app" title={t("Апп", "App")}>
        <SettingsRow emoji="🌐" label={t("Хэл", "Language")} value={LANGUAGES.find((item) => item.id === language)?.label} onClick={() => setSheet("language")} />
        <SettingsRow emoji="🎨" label={t("Өнгө", "Appearance")} value={THEMES.find((item) => item.id === theme)?.label} onClick={() => setSheet("theme")} />
      </SettingsGroup>

      <SettingsGroup title={t("Тусламж", "Help & legal")}>
        <SettingsRow emoji="💗" label={t("Итгэдэг том хүнтэй ярилцах", "Talk to a trusted adult")} onClick={() => setSheet("safety")} />
        <SettingsRow emoji="❓" label={t("Тусламж", "Help")} onClick={() => setSheet("help")} />
        <SettingsRow emoji="📄" label={t("Нууцлалын бодлого", "Privacy policy")} onClick={() => setSheet("policy")} />
      </SettingsGroup>

      {sheet === "bag" && <BottomSheet title={t("🎒 Миний цүнх", "🎒 My bag")} onClose={close}><div className="pb-2"><DaughterSupplies embedded /></div></BottomSheet>}
      {sheet === "wishes" && <BottomSheet title={t("🎁 Миний хүслүүд", "🎁 My wishes")} onClose={close}><div className="pb-2"><ComingSoon /></div></BottomSheet>}
      {sheet === "cycle" && <MyCycleSheet onClose={close} />}
      {sheet === "guardian" && <GuardianSheet onClose={close} />}
      {sheet === "connect" && <BottomSheet title={t("🔗 Асран хамгаалагчтай холбогдох", "🔗 Connect to a guardian")} onClose={close}><div className="pb-2"><GuardianConnectForm /></div></BottomSheet>}
      {sheet === "pin" && <BottomSheet title={t("🔒 Нууц тэмдэглэлийн түгжээ", "🔒 Private note lock")} onClose={close}><div className="pb-2"><PrivateNotePinSettings /></div></BottomSheet>}
      {sheet === "notifications" && <BottomSheet title={t("🔔 Мэдэгдэл", "🔔 Notifications")} onClose={close}><NotificationSettings /></BottomSheet>}
      {sheet === "language" && <BottomSheet title={t("🌐 Хэл", "🌐 Language")} onClose={close}><div className="pb-2"><SegmentedChoice options={LANGUAGES} value={language} onChange={setLanguage} /></div></BottomSheet>}
      {sheet === "theme" && <BottomSheet title={t("🎨 Өнгө", "🎨 Appearance")} onClose={close}><div className="pb-2"><SegmentedChoice options={THEMES} value={theme} onChange={setTheme} /></div></BottomSheet>}
      {sheet === "help" && <BottomSheet title={t("❓ Тусламж", "❓ Help")} onClose={close}><QaList items={localizedQuestions(FAQ)} /></BottomSheet>}
      {sheet === "safety" && <BottomSheet title={t("💗 Чи ганцаараа биш", "💗 You are not alone")} onClose={close}><SafetyCard /></BottomSheet>}
      {sheet === "policy" && <BottomSheet title={t("📄 Нууцлалын бодлого", "📄 Privacy policy")} onClose={close}>
        <p className="mb-3 w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">{t("📝 Ноорог · хянагдаж байна", "📝 Draft · under review")}</p>
        <QaList items={localizedQuestions(POLICY)} />
      </BottomSheet>}
    </div>
  );
}
