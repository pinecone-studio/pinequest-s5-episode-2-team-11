"use client";

import { useMemo, useRef, useState } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { useFriends } from "../../../context/FriendsContext";
import {
  AGAIN, DAUGHTER_IDEA_MAX, EASE_LABELS, EMBARRASSMENT, FEATURES, GUARDIAN_IMPROVE_MAX, HELPED, PAY, SMILEYS,
  featureLabel, pickAgainFeature,
} from "../../../lib/feedback";
import { feedbackRequest } from "../../../lib/feedback-client";
import { useAvatar } from "../avatar/useAvatar";
import BottomSheet from "../ui/BottomSheet";
import SafetyCard from "./SafetyCard";
import { useUsedFeatures } from "./useUsedFeatures";

const SURVEY_XP = 10;
const big = (active) => `min-h-14 rounded-2xl border-2 px-3 py-3 text-base font-extrabold transition active:scale-95 ${active ? "bb-border-F48FB1 bb-bg-FDE7F1 bb-text-B83B7E" : "border-slate-100 bg-white text-slate-700"}`;

function Question({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black leading-snug text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function Choices({ options, value, onPick, columns = 3 }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map(([id, label]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onPick(id)} className={big(value === id)}>{label}</button>)}
    </div>
  );
}

function Scale({ min, max, value, onPick, left, right }) {
  const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return (
    <div>
      <div className={`grid gap-1.5 ${values.length > 6 ? "grid-cols-6" : "grid-cols-5"}`}>
        {values.map((number) => (
          <button key={number} type="button" aria-pressed={value === number} onClick={() => onPick(number)}
            className={`h-12 rounded-xl border-2 text-base font-black transition active:scale-95 ${value === number ? "bb-border-F48FB1 bb-bg-FDE7F1 bb-text-B83B7E" : "border-slate-100 bg-white text-slate-600"}`}>{number}</button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-bold text-slate-400"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

/** One question per screen, every step skippable. Submits whatever was answered at the end. */
export default function FeedbackSurvey({ role, noPeriodYet = false, onClose }) {
  const { profile, setToast } = useFamily();
  const { friends } = useFriends();
  const isDaughter = role === "daughter";
  const used = useUsedFeatures(isDaughter ? profile?.id : null, friends?.length ?? 0);
  const avatar = useAvatar(isDaughter ? profile?.id : null, setToast);
  const [answers, setAnswers] = useState(isDaughter ? { embarrassmentWording: noPeriodYet ? "worried" : "embarrassed" } : {});
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null); // { safety }

  const againFeature = useMemo(() => (isDaughter ? pickAgainFeature(used ?? [], answers.favorite ?? null) : null), [isDaughter, used, answers.favorite]);

  const steps = isDaughter
    ? ["smiley", "favorite", ...(againFeature ? ["again"] : []), "embarrassment", "idea"]
    : ["nps", "ease", "helpedTalk", "trust", "pay", "improve"];
  const current = steps[Math.min(step, steps.length - 1)];
  const last = step >= steps.length - 1;

  const submit = async (finalAnswers) => {
    setSending(true);
    const result = await feedbackRequest("submit", { answers: finalAnswers });
    setSending(false);
    if (result.error) { setToast("Илгээж чадсангүй. Дахин оролдоно уу."); return; }
    if (isDaughter) avatar.bonus(SURVEY_XP);
    setDone({ safety: Boolean(result.safety) });
  };

  const next = (patch = {}) => {
    const merged = { ...answers, ...patch };
    setAnswers(merged);
    if (last) submit(merged);
    else setStep((value) => value + 1);
  };
  // One-tap questions move on by themselves (a quick double tap still counts once).
  const advancing = useRef(false);
  const pick = (key, value) => {
    if (advancing.current) return;
    advancing.current = true;
    setAnswers((current) => ({ ...current, [key]: value }));
    setTimeout(() => { advancing.current = false; next({ [key]: value }); }, 180);
  };

  if (done) {
    return (
      <BottomSheet title="Санал хүсэлт" onClose={onClose}>
        <div className="space-y-4 pb-2 text-center">
          <p className="pt-4 text-4xl" aria-hidden="true">{isDaughter ? "💗" : "🙏"}</p>
          <p className="text-lg font-black leading-snug text-slate-800">
            {isDaughter ? "Баярлалаа! Чиний санаа Bloomy-г илүү сайхан болгоно 💗" : "Баярлалаа! Таны санал бидэнд маш чухал 🙏"}
          </p>
          {isDaughter && <p className="text-sm font-bold bb-text-7C4DCC">+{SURVEY_XP} XP · +{SURVEY_XP} 🌸</p>}
          {done.safety && <SafetyCard />}
          <button type="button" onClick={onClose} className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white">Хаах</button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet title="Санал хүсэлт" onClose={onClose}>
      <div className="space-y-5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`${step + 1}/${steps.length} асуулт`}>
            {steps.map((id, index) => <span key={id} className={`h-2 rounded-full transition-all ${index === step ? "w-5 bb-bg-E0679F" : index < step ? "w-2 bb-bg-F48FB1" : "w-2 bg-slate-200"}`} />)}
          </div>
          <button type="button" onClick={() => next()} disabled={sending} className="rounded-full px-3 py-1.5 text-xs font-extrabold text-slate-400">Алгасах</button>
        </div>

        {current === "smiley" && <Question title="Bloomy-д хэр дуртай вэ?">
          <div className="grid grid-cols-5 gap-2">
            {SMILEYS.map(({ value, emoji }) => <button key={value} type="button" aria-label={`${value}`} aria-pressed={answers.smiley === value} onClick={() => pick("smiley", value)} className={`${big(answers.smiley === value)} text-3xl`}>{emoji}</button>)}
          </div>
        </Question>}

        {current === "favorite" && <Question title="Аль хэсэг нь хамгийн их таалагдсан бэ?">
          <div className="grid grid-cols-3 gap-2">
            {FEATURES.map((feature) => (
              <button key={feature.id} type="button" aria-pressed={answers.favorite === feature.id} onClick={() => pick("favorite", feature.id)} className={`${big(answers.favorite === feature.id)} flex flex-col items-center gap-1 text-sm`}>
                <span className="text-2xl" aria-hidden="true">{feature.emoji}</span>{feature.label}
              </button>
            ))}
          </div>
        </Question>}

        {current === "again" && againFeature && <Question title={`Дахиад «${featureLabel(againFeature)}» хэсгийг хиймээр байна уу?`}>
          <Choices options={AGAIN} value={answers.again?.answer} onPick={(value) => pick("again", { feature: againFeature, answer: value })} />
        </Question>}

        {current === "embarrassment" && <Question title={noPeriodYet ? "Сарын тэмдгийн талаар бодохоор санаа зовох нь…" : "Bloomy-г ашигласны дараа сарын тэмдгийн талаар ичих нь…"}>
          <Choices options={EMBARRASSMENT} value={answers.embarrassment} onPick={(value) => pick("embarrassment", value)} columns={1} />
        </Question>}

        {current === "idea" && <Question title="Юу нэммээр байна?">
          <textarea value={answers.idea ?? ""} onChange={(event) => setAnswers({ ...answers, idea: event.target.value.slice(0, DAUGHTER_IDEA_MAX) })} rows={4} maxLength={DAUGHTER_IDEA_MAX}
            placeholder="Жишээ нь: илүү олон хувцас" className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-pink-300" />
          <p className="text-right text-[11px] font-bold text-slate-400">{(answers.idea ?? "").length}/{DAUGHTER_IDEA_MAX}</p>
        </Question>}

        {current === "nps" && <Question title="Bloomy-г бусад эцэг эхэд санал болгох уу?">
          <Scale min={0} max={10} value={answers.nps} onPick={(value) => pick("nps", value)} left="Огт үгүй" right="Заавал" />
        </Question>}

        {current === "ease" && <Question title="Апп ашиглахад хэр амар байсан бэ?">
          <Scale min={1} max={5} value={answers.ease} onPick={(value) => pick("ease", value)} left={EASE_LABELS[0]} right={EASE_LABELS[4]} />
        </Question>}

        {current === "helpedTalk" && <Question title="Bloomy охинтойгоо энэ сэдвээр ярилцахад тусалсан уу?">
          <Choices options={HELPED} value={answers.helpedTalk} onPick={(value) => pick("helpedTalk", value)} />
        </Question>}

        {current === "trust" && <Question title="Охиныхоо мэдээллийн нууцлалд итгэлтэй байна уу?">
          <Scale min={1} max={5} value={answers.trust} onPick={(value) => pick("trust", value)} left="Огт итгэхгүй" right="Бүрэн итгэлтэй" />
        </Question>}

        {current === "pay" && <Question title="Нэмэлт боломжуудад сард 6,900₮ төлөх үү?">
          <Choices options={PAY} value={answers.pay} onPick={(value) => pick("pay", value)} />
        </Question>}

        {current === "improve" && <Question title="Юуг сайжруулмаар байна?">
          <textarea value={answers.improve ?? ""} onChange={(event) => setAnswers({ ...answers, improve: event.target.value.slice(0, GUARDIAN_IMPROVE_MAX) })} rows={4} maxLength={GUARDIAN_IMPROVE_MAX}
            className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-white p-3 text-sm font-semibold text-slate-700 outline-none focus:border-pink-300" />
          <p className="text-right text-[11px] font-bold text-slate-400">{(answers.improve ?? "").length}/{GUARDIAN_IMPROVE_MAX}</p>
        </Question>}

        {(current === "idea" || current === "improve") && (
          <button type="button" onClick={() => next()} disabled={sending} className="w-full rounded-2xl bb-bg-E0679F py-3.5 text-sm font-extrabold text-white disabled:opacity-60">
            {sending ? "Илгээж байна…" : "Илгээх"}
          </button>
        )}
        {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="w-full py-1 text-xs font-extrabold text-slate-400">← Буцах</button>}
      </div>
    </BottomSheet>
  );
}
