"use client";

/**
 * FriendsContext — Найзууд · Хэрэглэлийн SOS (зөвхөн охидод).
 *
 * FamilyContext-ээс тусдаа: найзуудын хэсэг дээр ажиллах хүн гэр бүлийн кодыг огт өөрчлөхгүй.
 * Database: supabase/friends.sql
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useFamily } from "./FamilyContext";
import { SOS_REPLIES, SOS_WINDOW_HOURS, friendError, placeOf } from "../lib/friends";

const FriendsContext = createContext(null);

const sinceIso = () => new Date(Date.now() - SOS_WINDOW_HOURS * 3600 * 1000).toISOString();

export function FriendsProvider({ children }) {
  const { session, profile, view, ready, setToast } = useFamily();
  const userId = session?.user?.id ?? null;
  const active = Boolean(supabase && userId && ready && view === "daughter");

  const [friendCode, setFriendCode] = useState("");
  const [friends, setFriends] = useState([]); // friend names and shared avatar customization only
  const [groups, setGroups] = useState([]); // [{ id, name, emoji, members: [id] }]
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [place, setPlace] = useState("");
  const [outgoing, setOutgoing] = useState(null); // { id, group_name, place, responses: [] }
  const [sending, setSending] = useState(false);
  const [incoming, setIncoming] = useState([]); // [{ id, sender_name, place, created_at, myReply }]

  /* ---------- Татах ---------- */
  const loadFriends = useCallback(async () => {
    const { data, error } = await supabase.rpc("list_friends_with_avatars");
    if (error) {
      setToast(friendError(error));
      return;
    }
    setFriends(data ?? []);
  }, [setToast]);

  const loadGroups = useCallback(async () => {
    const { data } = await supabase
      .from("friend_groups")
      .select("id, name, emoji, created_at, friend_group_members(member_id)")
      .order("created_at");
    const list = (data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      members: (g.friend_group_members ?? []).map((m) => m.member_id),
    }));
    setGroups(list);
    setActiveGroupId((cur) => (list.some((g) => g.id === cur) ? cur : (list[0]?.id ?? null)));
  }, []);

  const loadOutgoing = useCallback(async () => {
    const { data } = await supabase
      .from("pad_requests")
      .select("id, group_name, place, created_at, pad_responses(responder_name, reply, created_at)")
      .eq("sender_id", userId)
      .eq("resolved", false)
      .gte("created_at", sinceIso())
      .order("created_at", { ascending: false })
      .limit(1);
    const r = data?.[0];
    setOutgoing(
      r
        ? {
            ...r,
            responses: [...(r.pad_responses ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
          }
        : null,
    );
  }, [userId]);

  const loadIncoming = useCallback(async () => {
    const { data } = await supabase
      .from("pad_requests")
      .select("id, sender_name, place, created_at, resolved, pad_responses(reply, responder_id)")
      .neq("sender_id", userId)
      .eq("resolved", false)
      .gte("created_at", sinceIso())
      .order("created_at", { ascending: false })
      .limit(5);
    setIncoming(
      (data ?? []).map((r) => ({
        ...r,
        myReply: (r.pad_responses ?? []).find((x) => x.responder_id === userId)?.reply ?? null,
      })),
    );
  }, [userId]);

  const loadAll = useCallback(async () => {
    if (!active) return;
    setFriendCode(profile?.friend_code ?? "");
    await Promise.all([loadFriends(), loadGroups(), loadOutgoing(), loadIncoming()]);
  }, [active, profile?.friend_code, loadFriends, loadGroups, loadOutgoing, loadIncoming]);

  useEffect(() => {
    if (active) loadAll();
    else {
      setFriends([]);
      setGroups([]);
      setOutgoing(null);
      setIncoming([]);
    }
  }, [active, loadAll]);

  // friend_code нь profile-д байхгүй бол (friends.sql-ээс өмнөх хуучин сесс) дахин уншина
  useEffect(() => {
    if (!active || profile?.friend_code) return;
    supabase
      .from("profiles")
      .select("friend_code")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => data?.friend_code && setFriendCode(data.friend_code));
  }, [active, profile?.friend_code, userId]);

  /* ---------- Realtime ---------- */
  useEffect(() => {
    if (!active) return;
    const channel = supabase
      .channel(`friends-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pad_request_recipients",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await loadIncoming();
          setToast("🆘 Найз чинь хэрэглэл хэрэгтэй байна!");
          try {
            navigator.vibrate?.([200, 100, 200]);
          } catch {
            /* ignore */
          }
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "pad_responses" }, () => loadOutgoing())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pad_requests" }, () => {
        loadIncoming();
        loadOutgoing();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `user_id=eq.${userId}` },
        () => loadFriends(),
      )
      .subscribe();
    const onVisible = () => document.visibilityState === "visible" && loadAll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, userId, loadIncoming, loadOutgoing, loadFriends, loadAll, setToast]);

  /* ---------- Найз ---------- */
  const addFriend = async (code) => {
    const { data, error } = await supabase.rpc("add_friend", { p_code: code.trim() });
    if (error) return friendError(error);
    await loadFriends();
    setToast(`${data?.display_name || "Найз"} найзаар нэмэгдлээ 💗`);
    return null;
  };

  const removeFriend = async (friend) => {
    const { error } = await supabase.rpc("remove_friend", { p_friend: friend.id });
    if (error) return setToast(friendError(error));
    await Promise.all([loadFriends(), loadGroups()]);
    setToast(`${friend.display_name} найзуудаас хасагдлаа`);
  };

  /* ---------- Бүлэг ---------- */
  const createGroup = async ({ name, emoji, memberIds }) => {
    const { data, error } = await supabase
      .from("friend_groups")
      .insert({ owner_id: userId, name: name.trim(), emoji })
      .select("id")
      .single();
    if (error) return (setToast(friendError(error)), false);
    if (memberIds.length) {
      await supabase
        .from("friend_group_members")
        .insert(memberIds.map((member_id) => ({ group_id: data.id, member_id })));
    }
    await loadGroups();
    setActiveGroupId(data.id);
    setToast("Шинэ бүлэг үүслээ 💗");
    return true;
  };

  const toggleMember = async (group, friend) => {
    const has = group.members.includes(friend.id);
    if (has && group.members.length <= 1) return;
    setGroups((gs) =>
      gs.map((g) =>
        g.id !== group.id
          ? g
          : { ...g, members: has ? g.members.filter((m) => m !== friend.id) : [...g.members, friend.id] },
      ),
    );
    const { error } = has
      ? await supabase
          .from("friend_group_members")
          .delete()
          .eq("group_id", group.id)
          .eq("member_id", friend.id)
      : await supabase.from("friend_group_members").insert({ group_id: group.id, member_id: friend.id });
    if (error) {
      setToast(friendError(error));
      return loadGroups();
    }
    setToast(has ? `${friend.display_name} бүлгээс хасагдлаа` : `${friend.display_name} бүлэгт нэмэгдлээ 💗`);
  };

  const deleteGroup = async (group) => {
    await supabase.from("friend_groups").delete().eq("id", group.id);
    await loadGroups();
    setToast(`«${group.name}» бүлэг устлаа`);
  };

  /* ---------- SOS ---------- */
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  const sendSos = async (recipientIds) => {
    if (sending) return;
    const selectedFriends = friends.filter((friend) => recipientIds.includes(friend.id));
    if (!selectedFriends.length) return setToast("Мэдэгдэл илгээх найзаа сонгоно уу.");
    setSending(true);
    const started = Date.now();
    const { error } = await supabase.rpc("send_pad_request_to_friends", {
      p_recipient_ids: selectedFriends.map((friend) => friend.id),
      p_place: place.trim().slice(0, 40),
    });
    // Дуудлагын анимейшн хэтэрхий богино харагдахгүйн тулд
    await new Promise((r) => setTimeout(r, Math.max(0, 1200 - (Date.now() - started))));
    setSending(false);
    if (error) return setToast(friendError(error));
    await loadOutgoing();
    setToast(`${selectedFriends.length} найзад дохио очлоо 📣`);
  };

  const resolveSos = async () => {
    if (!outgoing) return;
    await supabase.from("pad_requests").update({ resolved: true }).eq("id", outgoing.id);
    setOutgoing(null);
  };

  const respond = async (request, reply) => {
    setIncoming((list) => list.map((r) => (r.id === request.id ? { ...r, myReply: reply } : r)));
    const { error } = await supabase.rpc("respond_pad_request", { p_request: request.id, p_reply: reply });
    if (error) {
      setToast(friendError(error));
      return loadIncoming();
    }
    setToast(reply === "no" ? "Хариу илгээлээ" : `${request.sender_name}-д хариу очлоо 💗`);
  };

  const sosStage = sending ? "ringing" : outgoing ? "sent" : "idle";
  const unansweredIncoming = incoming.filter((r) => !r.myReply).length;

  const value = useMemo(
    () => ({
      active,
      friendCode,
      friends,
      groups,
      activeGroup,
      setActiveGroupId,
      place,
      setPlace,
      placeInfo: placeOf(place),
      outgoing,
      sosStage,
      incoming,
      unansweredIncoming,
      replyText: (code) => SOS_REPLIES[code] ?? code,
      addFriend,
      removeFriend,
      createGroup,
      toggleMember,
      deleteGroup,
      sendSos,
      resolveSos,
      respond,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      active,
      friendCode,
      friends,
      groups,
      activeGroup,
      place,
      outgoing,
      sosStage,
      incoming,
      unansweredIncoming,
    ],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error("useFriends() must be used inside <FriendsProvider>");
  return ctx;
}
