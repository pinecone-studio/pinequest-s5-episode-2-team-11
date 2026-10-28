"use client";

/**
 * Өнөөдрийн сэтгэл санаа (1–5) — «Өнөөдөр ямар байна?» хэсэгт сонгосон утга.
 * Дүрийн царайны илэрхийлэлд ашиглана. Шинээр тэмдэглэхэд автоматаар шинэчлэгдэнэ.
 */

import { useEffect, useState } from "react";
import { localDateKey } from "../../../lib/cycle";
import { LOG_ENTRIES_CHANGED, fetchEntries, latestOf } from "../../../lib/log-entries";
import { supabase } from "../../../lib/supabase";

export function useTodayMood(userId) {
  const [mood, setMood] = useState(null);

  useEffect(() => {
    if (!userId || !supabase) return undefined;
    let cancelled = false;
    const date = localDateKey(new Date());
    const load = () =>
      fetchEntries(supabase, date, date).then(({ data, error }) => {
        if (!cancelled && !error) setMood(latestOf(data, "mood")?.value?.mood ?? null);
      });
    load();
    window.addEventListener(LOG_ENTRIES_CHANGED, load);
    return () => {
      cancelled = true;
      window.removeEventListener(LOG_ENTRIES_CHANGED, load);
    };
  }, [userId]);

  return mood;
}

// Найзын хуваалцсан сэтгэл санаа — зөвхөн өнөөдрийнх бол харуулна
export const friendMoodToday = (friend) =>
  friend?.avatar_mood_date === localDateKey(new Date()) ? friend.avatar_mood : null;
