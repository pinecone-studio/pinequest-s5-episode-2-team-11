"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const readJson = (key) => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
};

/**
 * Which parts of Bloomy she has used, from data that already exists (no new tracking):
 * friends · logged days · started a lesson · chatted · earned XP.
 */
export function useUsedFeatures(userId, friendsCount = 0) {
  const [used, setUsed] = useState(null);
  useEffect(() => {
    if (!userId || !supabase) return undefined;
    let cancelled = false;
    (async () => {
      const [logs, chats] = await Promise.all([
        supabase.from("log_entries").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      const localChat = readJson(`bloom:chat:${userId}`);
      const pad = readJson("bloomy:padGuide") ?? readJson("bloomy:padUsageDisposalGuide");
      const avatar = readJson(`bloomy:avatar:${userId}`);
      const list = [
        (chats.count ?? 0) > 0 || (Array.isArray(localChat) && localChat.length > 0) ? "helper" : null,
        friendsCount > 0 ? "friends" : null,
        (logs.count ?? 0) > 0 ? "today" : null,
        pad && (pad.finished || pad.part > 0 || pad.step > 0) ? "learn" : null,
        (avatar?.xp ?? 0) > 0 ? "avatar" : null,
      ].filter(Boolean);
      if (!cancelled) setUsed(list);
    })();
    return () => { cancelled = true; };
  }, [userId, friendsCount]);
  return used;
}
