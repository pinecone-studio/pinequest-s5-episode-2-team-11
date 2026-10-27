"use client";

/**
 * Санал хүсэлт — Профайл дээр гэр бүлийн кодын доор.
 * Database: supabase/feedback.sql (public.app_feedback, хэрэглэгч зөвхөн өөрийнхөө нэрээр илгээнэ).
 */

import { useState } from "react";
import { Loader2, MessageSquareHeart, Send, Star } from "lucide-react";
import { useFamily } from "../../../context/FamilyContext";
import { supabase } from "../../../lib/supabase";
import { getLang, t } from "../../../lib/i18n";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";

const MESSAGE_MAX = 1000;

const CATEGORIES = () => [
  { id: "idea", emoji: "💡", label: t("Санал", "Idea") },
  { id: "bug", emoji: "🐞", label: t("Алдаа", "Bug") },
  { id: "love", emoji: "💗", label: t("Талархал", "Thanks") },
];

const PLACEHOLDER = {
  idea: () => t("Bloomy-д юу нэмбэл таалагдах вэ?", "What would you love to see in Bloomy?"),
  bug: () => t("Юу болсон бэ? Аль дэлгэц дээр гэдгийг бичээрэй.", "What happened? Tell us which screen it was on."),
  love: () => t("Bloomy-гийн юу нь хамгийн их таалагдсан бэ?", "What do you like most about Bloomy?"),
};

export default function FeedbackCard() {
  const { session, profile, view, setToast } = useFamily();
  const [category, setCategory] = useState("idea");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const trimmed = message.trim();
  const canSend = Boolean(trimmed) && !sending && Boolean(supabase && session?.user?.id);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError("");
    const { error: insertError } = await supabase.from("app_feedback").insert({
      user_id: session.user.id,
      role: profile?.role ?? view ?? null,
      category,
      rating: rating || null,
      message: trimmed.slice(0, MESSAGE_MAX),
      app_language: getLang(),
    });
    setSending(false);
    if (insertError) {
      console.error("[app_feedback]", insertError);
      setError(t("Илгээж чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.", "Couldn't send. Check your internet and try again."));
      return;
    }
    setMessage("");
    setRating(0);
    setSent(true);
    setToast(t("Санал хүсэлт илгээлээ, баярлалаа 💗", "Feedback sent, thank you 💗"));
  };

  if (sent) {
    return (
      <Card>
        <SectionTitle icon={MessageSquareHeart} title={t("Санал хүсэлт", "Feedback")} right={null} titleStyle={{}} />
        <div className="rounded-2xl bb-bg-FDE7F1-50 p-4 text-center bloom-pop">
          <p className="text-2xl">💌</p>
          <p className="mt-1 font-black text-slate-700">{t("Баярлалаа!", "Thank you!")}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {t("Таны саналыг Bloomy-гийн баг уншина.", "The Bloomy team will read your feedback.")}
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-extrabold bb-text-B83B7E shadow-sm active:scale-95 transition"
          >
            {t("Дахин илгээх", "Send another")}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle icon={MessageSquareHeart} title={t("Санал хүсэлт", "Feedback")} right={null} titleStyle={{}} />
      <p className="text-xs font-semibold text-slate-500">
        {t("Bloomy-г илүү сайн болгоход тусалаарай. Санал, алдаа, талархлаа бичээрэй.", "Help make Bloomy better. Share an idea, a bug or some love.")}
      </p>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div role="radiogroup" aria-label={t("Төрөл", "Type")} className="grid grid-cols-3 gap-1.5 rounded-xl bb-bg-FFF7FB p-1">
          {CATEGORIES().map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={category === option.id}
              onClick={() => setCategory(option.id)}
              className={`rounded-lg px-2 py-2 text-xs font-extrabold transition ${
                category === option.id ? "bg-white bb-text-B83B7E shadow-sm settings-choice-active" : "text-slate-500"
              }`}
            >
              {option.emoji} {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-slate-500">{t("Bloomy-г үнэлэх (заавал биш)", "Rate Bloomy (optional)")}</span>
          <div className="flex items-center gap-0.5" role="radiogroup" aria-label={t("Үнэлгээ", "Rating")}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={t(`${n} од`, `${n} star${n > 1 ? "s" : ""}`)}
                onClick={() => setRating(rating === n ? 0 : n)}
                className="p-0.5 active:scale-90 transition"
              >
                <Star className={`h-5 w-5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value.slice(0, MESSAGE_MAX));
              setError("");
            }}
            rows={4}
            maxLength={MESSAGE_MAX}
            placeholder={PLACEHOLDER[category]()}
            aria-label={t("Санал хүсэлт", "Feedback")}
            className="w-full rounded-2xl border-2 border-slate-100 bg-white p-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 bb-focus-border-F48FB1"
          />
          <p className="mt-1 text-right text-[10px] font-bold text-slate-400">
            {message.length}/{MESSAGE_MAX}
          </p>
        </div>

        {error && <p role="alert" className="text-xs font-bold text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSend}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bb-grad-sos py-3 text-sm font-extrabold text-white transition active:scale-95 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? t("Илгээж байна…", "Sending…") : t("Илгээх", "Send")}
        </button>
        <p className="text-center text-[10px] font-semibold text-slate-400">
          {t("Хувийн мэдээлэл, нууц үгээ бүү бичээрэй.", "Please don't include personal info or passwords.")}
        </p>
      </form>
    </Card>
  );
}
