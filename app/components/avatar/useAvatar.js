"use client";

/**
 * useAvatar — дүрийн XP, 🌸 дэлбээ, хувцас, алхалт.
 * ДЕМО: өгөгдөл энэ утасны localStorage-д хадгалагдана (Supabase-гүй).
 * Жинхэнэ апп болоход энэ файлыг л Supabase руу шилжүүлнэ — дэлгэцүүд өөрчлөгдөхгүй.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  DAILY_GIFT,
  AVATAR_BACKGROUNDS,
  REWARD_PER_STEP_BLOCK,
  SKIN_TONES,
  START_PETALS,
  STARTER_LOOK,
  STARTER_OWNED,
  STEPS_PER_REWARD,
  WALK_XP_DAILY_CAP,
  itemById,
  levelOf,
} from "../../../lib/wardrobe";
import { t } from "../../../lib/i18n";

const today = () => new Date().toISOString().slice(0, 10);

const normalizeLook = (look) =>
  Object.fromEntries(
    Object.entries(STARTER_LOOK).map(([slot, fallback]) => {
      const id = look?.[slot];
      return [slot, itemById(id)?.slot === slot ? id : fallback];
    }),
  );

const normalizeSkin = (skin) =>
  Number.isInteger(skin) && skin >= 0 && skin < SKIN_TONES.length ? skin : 0;
const normalizeBackground = (background) =>
  AVATAR_BACKGROUNDS.some((option) => option.id === background) ? background : "room";

const fresh = () => ({
  xp: 0,
  xpSpent: 0,
  petals: START_PETALS,
  skin: 0,
  owned: STARTER_OWNED,
  look: STARTER_LOOK,
  background: "room",
  walk: { date: today(), steps: 0, xp: 0 },
  giftDate: null,
});

const read = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fresh();
    const saved = JSON.parse(raw);
    return {
      ...fresh(),
      ...saved,
      xpSpent: Number.isFinite(saved.xpSpent) ? Math.max(0, Math.floor(saved.xpSpent)) : 0,
      owned: Array.from(new Set([...STARTER_OWNED, ...(saved.owned ?? [])])),
      look: normalizeLook(saved.look),
      skin: normalizeSkin(saved.skin),
      background: normalizeBackground(saved.background),
    };
  } catch {
    return fresh();
  }
};

export function useAvatar(userId, onToast = () => {}) {
  const key = `bloomy:avatar:${userId || "guest"}`;
  const [state, setState] = useState(fresh);
  const [loaded, setLoaded] = useState(false);
  const [avatarSyncReady, setAvatarSyncReady] = useState(false);
  const toastRef = useRef(onToast);
  toastRef.current = onToast;

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setAvatarSyncReady(false);
    const localState = read(key);
    setState(localState);
    setLoaded(true);

    if (!supabase || !userId) {
      setAvatarSyncReady(true);
      return () => {
        cancelled = true;
      };
    }

    const loadSharedAvatar = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_look, avatar_skin, avatar_background")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        toastRef.current(t("Дүрийг серверээс ачаалж чадсангүй. Supabase-ийн тохиргоог шалгана уу.", "Couldn't load your avatar from the server. Check the Supabase setup."));
        return;
      }
      if (!data) {
        toastRef.current(t("Профайл олдсонгүй. Дүр зөвхөн энэ төхөөрөмжид хадгалагдана.", "Profile not found. Your avatar is only saved on this device."));
        return;
      }

      const remoteLook = normalizeLook(data.avatar_look);
      const remoteSkin = normalizeSkin(data.avatar_skin);
      const remoteBackground = normalizeBackground(data.avatar_background);
      const localHasCustomAvatar =
        JSON.stringify(localState.look) !== JSON.stringify(STARTER_LOOK) ||
        localState.skin !== 0 ||
        localState.background !== "room";
      const remoteHasCustomAvatar =
        JSON.stringify(remoteLook) !== JSON.stringify(STARTER_LOOK) ||
        remoteSkin !== 0 ||
        remoteBackground !== "room";
      const useLocalAvatar = localHasCustomAvatar && !remoteHasCustomAvatar;

      setState((current) => ({
        ...current,
        look: useLocalAvatar ? localState.look : remoteLook,
        skin: useLocalAvatar ? localState.skin : remoteSkin,
        background: useLocalAvatar ? localState.background : remoteBackground,
      }));
      setAvatarSyncReady(true);
    };

    loadSharedAvatar();
    return () => {
      cancelled = true;
    };
  }, [key, userId]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, loaded, state]);

  useEffect(() => {
    if (!loaded || !avatarSyncReady || !supabase || !userId) return;

    const timeout = setTimeout(async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_look: state.look,
          avatar_skin: state.skin,
          avatar_background: state.background,
        })
        .eq("id", userId);

      if (error) {
        toastRef.current(t("Дүрийг найзуудтай синк хийж чадсангүй. Интернэтээ шалгана уу.", "Couldn't sync your avatar with friends. Check your internet."));
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [avatarSyncReady, loaded, state.look, state.skin, state.background, userId]);

  // XP нэмэх бүрт түвшин ахисан эсэхийг шалгана
  const reward = (s, amount) => {
    if (amount <= 0) return s;
    const before = levelOf(s.xp);
    const next = { ...s, xp: s.xp + amount, petals: s.petals + amount };
    const after = levelOf(next.xp);
    if (after > before) setTimeout(() => toastRef.current(t(`${after}-р түвшин! Шинэ хувцас нээгдлээ ✨`, `Level ${after}! New outfits unlocked ✨`)), 0);
    return next;
  };

  const walkToday = state.walk.date === today() ? state.walk : { date: today(), steps: 0, xp: 0 };

  const addSteps = useCallback((n = 1) => {
    setState((s) => {
      const w = s.walk.date === today() ? s.walk : { date: today(), steps: 0, xp: 0 };
      const steps = w.steps + n;
      const blocks = Math.floor(steps / STEPS_PER_REWARD) - Math.floor(w.steps / STEPS_PER_REWARD);
      const gain = Math.max(0, Math.min(blocks * REWARD_PER_STEP_BLOCK, WALK_XP_DAILY_CAP - w.xp));
      return reward({ ...s, walk: { date: w.date, steps, xp: w.xp + gain } }, gain);
    });
  }, []);

  const giftReady = state.giftDate !== today();
  const claimGift = () => {
    if (!giftReady) return;
    setState((s) => reward({ ...s, giftDate: today() }, DAILY_GIFT));
    onToast(t(`Өдрийн бэлэг: +${DAILY_GIFT} XP, +${DAILY_GIFT} дэлбээ`, `Daily gift: +${DAILY_GIFT} XP, +${DAILY_GIFT} petals`));
  };

  const level = levelOf(state.xp);
  const availableXp = Math.max(0, state.xp - (state.xpSpent ?? 0));

  const spendXp = (amount) => {
    const cost = Math.max(0, Math.floor(Number(amount) || 0));
    if (!cost || availableXp < cost) return false;
    setState((current) => ({ ...current, xpSpent: (current.xpSpent ?? 0) + cost }));
    return true;
  };

  const buy = (id) => {
    const item = itemById(id);
    if (!item || state.owned.includes(id)) return false;
    if (level < item.level) return onToast(t(`${item.level}-р түвшинд нээгдэнэ`, `Unlocks at level ${item.level}`)), false;
    if (state.petals < item.price) return onToast(t(`${item.price - state.petals} дэлбээ дутуу байна. Алхаад цуглуулаарай!`, `You need ${item.price - state.petals} more petals. Go for a walk to collect them!`)), false;
    setState((s) => ({
      ...s,
      petals: s.petals - item.price,
      owned: [...s.owned, id],
      look: { ...s.look, [item.slot]: id },
    }));
    onToast(t(`«${item.name}» авлаа ✨`, `Got "${item.name}" ✨`));
    return true;
  };

  const equip = (id) => {
    const item = itemById(id);
    if (!item || !state.owned.includes(id)) return;
    setState((s) => ({ ...s, look: { ...s.look, [item.slot]: id } }));
  };

  const setSkin = (skin) => setState((s) => ({ ...s, skin }));
  const setBackground = (background) => {
    if (AVATAR_BACKGROUNDS.some((option) => option.id === background)) {
      setState((s) => ({ ...s, background }));
    }
  };

  const reset = () => setState(fresh());

  return {
    ...state,
    loaded,
    level,
    availableXp,
    spendXp,
    walkToday,
    giftReady,
    addSteps,
    claimGift,
    buy,
    equip,
    setSkin,
    setBackground,
    reset,
  };
}
