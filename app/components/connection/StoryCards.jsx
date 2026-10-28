"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authJson } from "../../../lib/api-client";
import { relationOf, relationWith } from "../../../lib/relation";
import Card from "../ui/Card";

/**
 * Daughter's Today page: stories her guardian left her. Replay any time;
 * when one ends she may start a talk (onTalk) or hide it («Нуух»).
 */
export default function StoryCards({ onTalk }) {
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
      {stories.slice(0, 3).map((story) => (
        <Card key={story.id} className="!p-4">
          <p className="text-sm font-black text-slate-700">💌 {relationOf(story.relation)} түүх</p>
          {story.kind === "audio" ? (
            // Signed URLs expire after 5 minutes; reloading the list renews them.
            <audio controls preload="none" src={story.audioUrl ?? undefined} onEnded={() => setFinished((value) => ({ ...value, [story.id]: true }))} onError={() => { if (!renewed.current.has(story.id)) { renewed.current.add(story.id); load(); } }} className="mt-3 w-full" />
          ) : null}
          {story.body && <p className="mt-3 whitespace-pre-wrap rounded-2xl bb-bg-FFF7FB p-3 text-sm font-semibold leading-relaxed text-slate-700">{story.body}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {onTalk && (story.kind === "text" || finished[story.id]) && (
              <button type="button" onClick={() => onTalk(story.relation)} className="rounded-xl bb-bg-E0679F px-3 py-2 text-xs font-extrabold text-white">
                {relationWith(story.relation)} энэ талаар ярих уу? 💬
              </button>
            )}
            <button type="button" onClick={() => hide(story.id)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-500">Нуух</button>
          </div>
        </Card>
      ))}
    </div>
  );
}
