"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import { Heart } from "lucide-react";
import { t } from "../../../lib/i18n";

const scale = ["😌", "🙂", "😐", "😟", "😣"];
const moodDetails = () => ([
  t("Тайван, сэтгэл санаа сайхан байна.", "Calm and in a good mood."),
  t("Ерөнхийдөө гайгүй, зарим зүйл жаахан санаа зовоож магадгүй.", "Mostly okay, though a few things may be a little worrying."),
  t("Сайн ч биш, муу ч биш — мэдрэмж дундаж байна.", "Not good, not bad — feeling just okay."),
  t("Сэтгэл тавгүй, гунигтай эсвэл амархан цухалдаж байна.", "Uneasy, sad or easily irritated."),
  t("Өнөөдөр сэтгэл санаа үнэхээр хүнд байна; дэмжлэг хэрэгтэй байж магадгүй.", "Today feels really heavy; you might need some support."),
]);
const painDetails = () => ([
  t("Өвдөлтгүй байна.", "No pain."),
  t("Бага зэрэг өвдөж байгаа ч өдөр тутмын зүйлээ хийж чадна.", "A little pain, but you can do your usual things."),
  t("Өвдөлт мэдрэгдэж, жаахан амрах хэрэгтэй байна.", "Some pain; you need a bit of rest."),
  t("Нэлээд хүчтэй өвдөж, хийх зүйлд саад болж байна.", "Quite strong pain that gets in the way of things."),
  t("Маш хүчтэй өвдөж байна; одоо амралт эсвэл тусламж хэрэгтэй байж магадгүй.", "Very strong pain; you may need rest or help now."),
]);
const storageKey = `bloom:checkin:${new Date().toISOString().slice(0, 10)}`;

function Rating({ title, value, onChange, details }) {
  return (
    <div>
      <p className="mb-2 text-sm font-extrabold text-slate-600">{title}</p>
      <div className="grid grid-cols-5 gap-2">
        {scale.map((emoji, i) => (
          <button key={emoji} type="button" onClick={() => onChange(i + 1)} aria-label={`${i + 1} / 5`}
            className={`rounded-2xl py-2 text-2xl transition ${value === i + 1 ? "bb-bg-E9DDFC-60 ring-2 ring-purple-300 scale-105" : "bg-slate-50"}`}>
            {emoji}
          </button>
        ))}
      </div>
      {value > 0 && <p className="mt-2 rounded-xl bb-bg-E9DDFC-50 px-3 py-2 text-xs font-semibold leading-relaxed text-slate-600">{details[value - 1]}</p>}
    </div>
  );
}

export default function TodayCheckin() {
  const { linked, sendToMom } = useFamily();
  const [mood, setMood] = useState(0);
  const [pain, setPain] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shareText, setShareText] = useState("");
  const [shareSent, setShareSent] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const checkin = JSON.parse(stored);
      setMood(checkin.mood ?? 0);
      setPain(checkin.pain ?? 0);
      setSaved(true);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const save = () => {
    if (!mood || !pain) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ mood, pain }));
    setSaved(true);
  };

  const shareWithMom = async () => {
    const text = shareText.trim();
    if (!text || !linked || shareSent) return;
    const sent = await sendToMom(t(`Өнөөдөр болсон зүйлээ хуваалцлаа: ${text}`, `Shared what happened today: ${text}`), "care");
    if (sent) setShareSent(true);
  };

  return (
    <Card>
      <SectionTitle icon={Heart} title={t("Өнөөдрийн vibe ямар байна?", "What's your vibe today?")} />
      <div className="space-y-4">
          <Rating title={t("Сэтгэл санаа", "Mood")} value={mood} details={moodDetails()} onChange={(value) => { setMood(value); setSaved(false); }} />
          <Rating title={t("Өвдөлт", "Pain")} value={pain} details={painDetails()} onChange={(value) => { setPain(value); setSaved(false); }} />
          <button type="button" disabled={!mood || !pain} onClick={save}
            className="w-full rounded-2xl bb-bg-E9DDFC py-3 text-sm font-extrabold bb-text-7C4DCC disabled:opacity-50">
            {saved ? t("Өнөөдрийн vibe тэмдэглэгдлээ ✓", "Today's vibe saved ✓") : t("Өөртөө тэмдэглэх", "Save for myself")}
          </button>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm font-extrabold text-slate-600">{t("Өнөөдөр болсон зүйлээ дотнын хэн нэгэнд хуваалцах уу?", "Want to share what happened today with someone close?")}</p>
        <textarea value={shareText} onChange={(event) => setShareText(event.target.value)} rows={3}
          placeholder={t("Хуваалцах зүйлээ энд бичээрэй…", "Write what you want to share…")}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400" />
        <button type="button" disabled={!linked || !shareText.trim() || shareSent} onClick={shareWithMom}
          className="mt-2 w-full rounded-2xl bb-bg-FDE7F1 py-3 text-sm font-extrabold bb-text-B83B7E disabled:opacity-50">
          {shareSent ? t("Илгээлээ ✓", "Sent ✓") : linked ? t("Дотнын хүндээ хуваалцах", "Share with someone close") : t("Асран хамгаалагчтайгаа холбогдоогүй байна", "Not connected with a guardian")}
        </button>
      </div>

    </Card>
  );
}