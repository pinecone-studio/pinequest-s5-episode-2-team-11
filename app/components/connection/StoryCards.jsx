"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { useLang } from "../../../context/LanguageContext";
import { authJson } from "../../../lib/api-client";
import { relationOf, relationWith } from "../../../lib/relation";
import { formatTime } from "../../../lib/dates";
import { t } from "../../../lib/i18n";
import Card from "../ui/Card";

const relationEnglish = (relation) => ({
  "Ээж": "Mom",
  "Аав": "Dad",
  "Асран хамгаалагч": "Guardian",
})[relation] ?? "Guardian";

/**
 * Daughter's Today page: stories her guardian left her. Replay any time;
 * when one ends she may start a talk (onTalk) or hide it («Нуух»).
 */
export default function StoryCards({ onTalk }) {
  const { lang } = useLang();
  const [stories, setStories] = useState([]);
  const [finished, setFinished] = useState({});
  const renewed = useRef(new Set());

  const load = useCallback(() => authJson("/api/stories").then((result) => setStories(result.stories ?? [])), []);
  useEffect(() => { load(); }, [load]);

  const hide = async (id) => {
    setStories((list) => list.filter((story) => story.id !== id));
    await authJson("/api/stories", "PATCH", { id, hidden: true });
  };

  if (!stories.length) return null;
  return (
    <div className="space-y-3">
      {stories.slice(0, 3).map((story) => {
        const relation = lang === "en" ? relationEnglish(story.relation) : story.relation;
        return (
        <Card key={story.id} className="!p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bb-bg-FDE7F1 bb-text-B83B7E">
              {story.kind === "audio" ? <Mic className="h-5 w-5" aria-hidden="true" /> : <span aria-hidden="true">💌</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-700">{lang === "en" ? `${relation}'s story` : `${relationOf(story.relation)} түүх`}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-400">
                {story.kind === "audio" ? t("Дуу хоолой", "Voice note") : t("Бичвэр", "Written story")}
                {story.createdAt ? ` · ${formatTime(story.createdAt)}` : ""}
              </p>
            </div>
          </div>
          {story.kind === "audio" ? (
            <div className="mt-3 rounded-2xl bg-slate-50 p-3">
              {story.audioUrl ? (
                <>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-500">{t("Дуу хоолой", `${relation}'s voice note`)}</span>
                    {story.durationSec ? <span className="text-[11px] font-bold text-slate-400">{Math.floor(story.durationSec / 60)}:{String(story.durationSec % 60).padStart(2, "0")}</span> : null}
                  </div>
                  <audio controls preload="none" src={story.audioUrl} onEnded={() => setFinished((value) => ({ ...value, [story.id]: true }))} onError={() => { if (!renewed.current.has(story.id)) { renewed.current.add(story.id); load(); } }} className="w-full" />
                </>
              ) : (
                <p className="text-xs font-semibold text-slate-500">{t("Бичлэгийг одоогоор ачаалж чадсангүй.", "This voice note isn't available right now.")}</p>
              )}
            </div>
          ) : null}
          {story.body && <p className="mt-3 whitespace-pre-wrap rounded-2xl bb-bg-FFF7FB p-3 text-sm font-semibold leading-relaxed text-slate-700">{story.body}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {onTalk && (story.kind === "text" || finished[story.id]) && (
              <button type="button" onClick={() => onTalk(story.relation)} className="min-h-10 rounded-xl bb-bg-E0679F px-3 py-2 text-xs font-extrabold text-white transition active:scale-95">
                {lang === "en" ? `Talk with ${relation} about it? 💬` : `${relationWith(story.relation)} энэ талаар ярих уу? 💬`}
              </button>
            )}
            <button type="button" onClick={() => hide(story.id)} className="min-h-10 rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-500 transition active:scale-95">{t("Нуух", "Hide")}</button>
          </div>
        </Card>
        );
      })}
    </div>
  );
}
