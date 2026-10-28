"use client";

import { useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { useTheme } from "../../../context/ThemeContext";
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
  ["Сарын тэмдгээ яаж тэмдэглэх вэ?", "Өнөөдөр хуудсан дээрх «🩸 Сарын тэмдэг маань өнөөдөр ирлээ» товчийг дар. Өөр өдрийг Хуанли дээрээс тухайн өдөр дээр дараад «💧 Сарын тэмдэг»-ээр тэмдэглэнэ."],
  ["Найзаа яаж нэмэх вэ?", "Найзууд хэсэгт «Найз нэмэх»-ийг дар. Тэнд чиний найзын код харагдана. Найзынхаа кодыг оруулаад нэмээрэй."],
  ["Миний тэмдэглэлийг хэн харах вэ?", "Зөвхөн чи. Нууц тэмдэглэлийг асран хамгаалагч ч, найзууд ч харахгүй."],
  ["Асран хамгаалагч маань юу харах вэ?", "Зөвхөн чиний зөвшөөрсөн зүйлийг. Жишээ нь «Сэтгэл санаа харах»-ыг асаасан бол сэтгэл санааг чинь харна. Үүнийг Профайл → Гэр бүл хэсгээс өөрчилнө."],
  ["Бидэнтэй яаж холбогдох вэ?", "Асран хамгаалагчаараа дамжуулан бидэнд бичээрэй. Холбоо барих хаяг удахгүй энд нэмэгдэнэ."],
];

const POLICY = [
  ["Бид юу хадгалдаг вэ?", "Нэр, имэйл, мөчлөгийн огноо, өдрийн тэмдэглэл (сэтгэл санаа, шинж тэмдэг, арьс, нойр), нууц тэмдэглэл, найзуудын жагсаалт."],
  ["Асран хамгаалагч юу харах вэ?", "Зөвхөн чиний зөвшөөрсөн зүйлийг. Чи хүссэн үедээ хуваалцахаа унтрааж болно."],
  ["Нууц тэмдэглэл", "Зөвхөн чамд харагдана. PIN тавьж түгжиж болно."],
  ["Бид мэдээллийг зардаг уу?", "Үгүй. Бид чиний мэдээллийг хэзээ ч зарахгүй, сурталчилгаанд ашиглахгүй."],
  ["Бүртгэлээ устгах", "Устгах хүсэлт илгээж болно. Асран хамгаалагч чинь баталгаажуулсны дараа бүх мэдээлэл устна."],
];

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
    if (ok) { setToast("Хадгаллаа"); onClose(); }
  };
  return (
    <BottomSheet title="📅 Миний мөчлөг" onClose={onClose}>
      <div className="space-y-5 pb-2">
        <Stepper id="profile-period-length" label="Сарын тэмдэг ойролцоогоор хэд хоног үргэлжилдэг вэ?" hint="Ихэвчлэн 3–7 хоног." value={period} setValue={setPeriod} min={2} max={7} />
        <Stepper id="profile-cycle-length" label="Мөчлөг ойролцоогоор хэд хоног вэ?" hint="Өсвөр насанд 21–45 хоног хэвийн. Мэдэхгүй бол 28 хэвээр нь үлдээгээрэй." value={cycle} setValue={setCycle} min={15} max={60} />
        <button type="button" onClick={save} disabled={busy} className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white disabled:opacity-60">{busy ? "Хадгалж байна…" : "Хадгалах"}</button>
      </div>
    </BottomSheet>
  );
}

function GuardianSheet({ onClose }) {
  const { guardianName, shareWithMom, setShareWithMom } = useFamily();
  return (
    <BottomSheet title={`💗 Асран хамгаалагч · ${guardianName || "Холбогдсон"}`} onClose={onClose}>
      <div className="space-y-2 pb-2">
        <p className="px-1 pb-1 text-xs font-semibold text-slate-500">Асран хамгаалагч чинь юу харахыг чи шийднэ.</p>
        <Toggle label="Сэтгэл санаа харах" hint="Хуваалцахаар сонгосон өдрийн сэтгэл санаа л харагдана" checked={Boolean(shareWithMom)} onChange={(value) => setShareWithMom(value)} />
        {/* TODO: no per-guardian backend yet for these three. */}
        <Toggle label="Календарь харах" hint="Удахгүй" checked disabled onChange={() => {}} />
        <Toggle label="Хэрэглэлийн хүсэлт авах" hint="Удахгүй" checked disabled onChange={() => {}} />
        <Toggle label="Дохио авах" hint="Удахгүй" checked disabled onChange={() => {}} />
        <p className="px-1 pt-1 text-[11px] font-semibold text-slate-400">Холболтыг зөвхөн асран хамгаалагч өөрийн апп-аас салгана.</p>
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
      setToast("Хүсэлт илгээж чадсангүй. Дахин оролдоно уу.");
      return;
    }
    setSent(true);
  };
  return (
    <BottomSheet title="Бүртгэл устгах" onClose={onClose}>
      {sent ? (
        <div className="space-y-3 pb-2">
          <p className="rounded-2xl bb-bg-FDE7F1 p-4 text-sm font-bold bb-text-B83B7E">
            {linked ? "Хүсэлт илгээгдлээ. Асран хамгаалагч чинь баталгаажуулна." : "Хүсэлт илгээгдлээ."}
          </p>
          <button type="button" onClick={onClose} className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">Хаах</button>
        </div>
      ) : (
        <div className="space-y-3 pb-2">
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            Бүртгэл устгавал мөчлөг, өдрийн тэмдэглэл, нууц тэмдэглэл, найзууд, дүр зэрэг <b>бүх мэдээлэл устана</b>. Буцааж сэргээх боломжгүй.
          </p>
          <p className="text-xs font-semibold text-slate-500">Асран хамгаалагч чинь баталгаажуулсны дараа устгана.</p>
          <label className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={understood} onChange={(event) => setUnderstood(event.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-500" />
            Бүх мэдээлэл устахыг ойлгосон
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-slate-100 py-3 text-sm font-extrabold text-slate-600">Болих</button>
            <button type="button" onClick={send} disabled={!understood || busy} className="rounded-2xl bg-rose-500 py-3 text-sm font-extrabold text-white disabled:opacity-40">{busy ? "Илгээж байна…" : "Устгах хүсэлт илгээх"}</button>
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
  const subtitle = avatar.loaded ? `Түв. ${avatar.level} · 🌸 ${avatar.petals}` : null;

  return (
    <div className="space-y-5">
      {showProfile && <ProfileCard compact subtitle={subtitle} />}

      {showProfile && <SettingsGroup title="Миний зүйлс" className="my-things-list">
        <SettingsRow emoji="🎒" label="Миний цүнх" onClick={() => setSheet("bag")} />
        <SettingsRow emoji="🎁" label="Миний хүслүүд" value="Удахгүй" onClick={() => setSheet("wishes")} />
        <SettingsRow emoji="📅" label="Миний мөчлөг" value={cycleLength ? `${cycleLength} хоног` : null} onClick={() => setSheet("cycle")} />
      </SettingsGroup>}

      {showSettings && <SettingsGroup title="Гэр бүл">
        {linked
          ? <SettingsRow emoji="💗" label={`Асран хамгаалагч · ${guardianName || "Холбогдсон"}`} onClick={() => setSheet("guardian")} />
          : <SettingsRow emoji="🔗" label="Асран хамгаалагчтай холбогдох" onClick={() => setSheet("connect")} />}
        {/* TODO: «➕ Асран хамгаалагч нэмэх» — a family has one guardian (families.created_by) today. */}
      </SettingsGroup>}

      {showSettings && <SettingsGroup title="Нууцлал">
        <SettingsRow emoji="🔒" label="Нууц тэмдэглэлийн түгжээ" onClick={() => setSheet("pin")} />
        <SettingsRow emoji="🔔" label="Мэдэгдэл" onClick={() => setSheet("notifications")} />
      </SettingsGroup>}

      {showSettings && <SettingsGroup id="app" title="Апп">
        <SettingsRow emoji="🌐" label="Хэл" value={LANGUAGES.find((item) => item.id === language)?.label} onClick={() => setSheet("language")} />
        <SettingsRow emoji="🎨" label="Өнгө" value={THEMES.find((item) => item.id === theme)?.label} onClick={() => setSheet("theme")} />
      </SettingsGroup>}

      {showProfile && <SettingsGroup title="Тусламж">
        <SettingsRow emoji="💗" label="Итгэдэг том хүнтэй ярилцах" onClick={() => setSheet("safety")} />
        <SettingsRow emoji="❓" label="Тусламж" onClick={() => setSheet("help")} />
        <SettingsRow emoji="📄" label="Нууцлалын бодлого" onClick={() => setSheet("policy")} />
      </SettingsGroup>}

      {showProfile && sheet === "bag" && <BottomSheet title="🎒 Миний цүнх" onClose={close}><div className="pb-2"><DaughterSupplies embedded /></div></BottomSheet>}
      {showProfile && sheet === "wishes" && <BottomSheet title="🎁 Миний хүслүүд" onClose={close}><div className="pb-2"><ComingSoon /></div></BottomSheet>}
      {showProfile && sheet === "cycle" && <MyCycleSheet onClose={close} />}
      {showSettings && sheet === "guardian" && <GuardianSheet onClose={close} />}
      {showSettings && sheet === "connect" && <BottomSheet title="🔗 Асран хамгаалагчтай холбогдох" onClose={close}><div className="pb-2"><GuardianConnectForm /></div></BottomSheet>}
      {showSettings && sheet === "pin" && <BottomSheet title="🔒 Нууц тэмдэглэлийн түгжээ" onClose={close}><div className="pb-2"><PrivateNotePinSettings /></div></BottomSheet>}
      {showSettings && sheet === "notifications" && <BottomSheet title="🔔 Мэдэгдэл" onClose={close}><NotificationSettings /></BottomSheet>}
      {showSettings && sheet === "language" && <BottomSheet title="🌐 Хэл" onClose={close}><div className="pb-2"><SegmentedChoice options={LANGUAGES} value={language} onChange={setLanguage} /></div></BottomSheet>}
      {showSettings && sheet === "theme" && <BottomSheet title="🎨 Өнгө" onClose={close}><div className="pb-2"><SegmentedChoice options={THEMES} value={theme} onChange={setTheme} /></div></BottomSheet>}
      {showProfile && sheet === "help" && <BottomSheet title="❓ Тусламж" onClose={close}><QaList items={FAQ} /></BottomSheet>}
      {showProfile && sheet === "safety" && <BottomSheet title="💗 Чи ганцаараа биш" onClose={close}><SafetyCard /></BottomSheet>}
      {showProfile && sheet === "policy" && <BottomSheet title="📄 Нууцлалын бодлого" onClose={close}>
        <p className="mb-3 w-fit rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-700">📝 Ноорог · хянагдаж байна</p>
        <QaList items={POLICY} />
      </BottomSheet>}
    </div>
  );
}
