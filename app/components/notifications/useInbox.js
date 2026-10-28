"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

/** The signed-in user's notifications (newest first, realtime) for the header bell. */
export function useInbox(userId) {
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    if (!supabase || !userId) { setRows([]); return; }
    const { data, error } = await supabase.from("notifications")
      .select("id, event, kind, priority, title, body, text, url, read, status, created_at")
      .eq("recipient_id", userId).order("created_at", { ascending: false }).limit(50);
    if (error) console.warn("[inbox]", error.message);
    else setRows(data ?? []);
  }, [userId]);

  useEffect(() => {
    load();
    if (!supabase || !userId) return undefined;
    const channel = supabase.channel(`inbox-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, load)
      .subscribe();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => { supabase.removeChannel(channel); window.removeEventListener("focus", onFocus); };
  }, [userId, load]);

  const markRead = useCallback(async (id) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, read: true, status: "read" } : row)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    const ids = rows.filter((row) => !row.read).map((row) => row.id);
    if (!ids.length) return;
    setRows((current) => current.map((row) => ({ ...row, read: true, status: "read" })));
    await supabase.from("notifications").update({ read: true }).in("id", ids);
  }, [rows]);

  const unread = useMemo(() => rows.filter((row) => !row.read).length, [rows]);
  return { rows, unread, markRead, markAllRead, reload: load };
}
