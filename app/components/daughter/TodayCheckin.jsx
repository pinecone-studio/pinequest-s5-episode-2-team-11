"use client";

import { useEffect, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import { Heart } from "lucide-react";

const scale = ["😌", "🙂", "😐", "😟", "😣"];
const moodDetails = [
  "Тайван, сэтгэл санаа сайхан байна.",
  "Ерөнхийдөө гайгүй, зарим зүйл жаахан санаа зовоож магадгүй.",
  "Сайн ч биш, муу ч биш — мэдрэмж дундаж байна.",
  "Сэтгэл тавгүй, гунигтай эсвэл амархан цухалдаж байна.",
  "Өнөөдөр сэтгэл санаа үнэхээр хүнд байна; дэмжлэг хэрэгтэй байж магадгүй.",
];
const painDetails = [
  "Өвдөлтгүй байна.",
  "Бага зэрэг өвдөж байгаа ч өдөр тутмын зүйлээ хийж чадна.",
  "Өвдөлт мэдрэгдэж, жаахан амрах хэрэгтэй байна.",
  "Нэлээд хүчтэй өвдөж, хийх зүйлд саад болж байна.",
  "Маш хүчтэй өвдөж байна; одоо амралт эсвэл тусламж хэрэгтэй байж магадгүй.",
];
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
    const sent = await sendToMom(`Өнөөдөр болсон зүйлээ хуваалцлаа: ${text}`, "care");
    if (sent) setShareSent(true);
  };

  return (
    <Card>
      <SectionTitle icon={Heart} title="Өнөөдрийн vibe ямар байна?" />
      <div className="space-y-4">
          <Rating title="Сэтгэл санаа" value={mood} details={moodDetails} onChange={(value) => { setMood(value); setSaved(false); }} />
          <Rating title="Өвдөлт" value={pain} details={painDetails} onChange={(value) => { setPain(value); setSaved(false); }} />
          <button type="button" disabled={!mood || !pain} onClick={save}
            className="w-full rounded-2xl bb-bg-E9DDFC py-3 text-sm font-extrabold bb-text-7C4DCC disabled:opacity-50">
            {saved ? "Өнөөдрийн vibe тэмдэглэгдлээ ✓" : "Өөртөө тэмдэглэх"}
          </button>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm font-extrabold text-slate-600">Өнөөдөр болсон зүйлээ дотнын хэн нэгэнд хуваалцах уу?</p>
        <textarea value={shareText} onChange={(event) => setShareText(event.target.value)} rows={3}
          placeholder="Хуваалцах зүйлээ энд бичээрэй…"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400" />
        <button type="button" disabled={!linked || !shareText.trim() || shareSent} onClick={shareWithMom}
          className="mt-2 w-full rounded-2xl bb-bg-FDE7F1 py-3 text-sm font-extrabold bb-text-B83B7E disabled:opacity-50">
          {shareSent ? "Илгээлээ ✓" : linked ? "Дотнын хүндээ хуваалцах" : "Асран хамгаалагчтайгаа холбогдоогүй байна"}
        </button>
      </div>

    </Card>
  );
}
