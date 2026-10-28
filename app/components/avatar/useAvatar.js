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
import { DEFAULT_CONFIG, isOwned, keysOf, migrateLook, normalizeConfig, priceOf } from "../../../lib/avatar";

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
  config: DEFAULT_CONFIG, // layered avatar (lib/avatar.ts); `look`/`skin` are the old pixel avatar
  background: "room",
  walk: { date: today(), steps: 0, xp: 0 },
  giftDate: null,
});

const read = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fresh();
    const saved = JSON.parse(raw);
    // Old saves have only the pixel `look` → map it to the closest new items once.
    const config = saved.config ? normalizeConfig(saved.config) : migrateLook(saved.look, saved.skin);
    return {
      ...fresh(),
      ...saved,
      config,
      hasConfig: Boolean(saved.config),
      xpSpent: Number.isFinite(saved.xpSpent) ? Math.max(0, Math.floor(saved.xpSpent)) : 0,
      owned: Array.from(new Set([...STARTER_OWNED, ...(saved.owned ?? []), ...keysOf(config)])),
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
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        toastRef.current("Дүрийг серверээс ачаалж чадсангүй. Supabase-ийн тохиргоог шалгана уу.");
        return;
      }
      if (!data) {
        toastRef.current("Профайл олдсонгүй. Дүр зөвхөн энэ төхөөрөмжид хадгалагдана.");
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

      const config = data.avatar_config
        ? normalizeConfig(data.avatar_config)
        : localState.hasConfig
          ? localState.config
          : migrateLook(useLocalAvatar ? localState.look : remoteLook, useLocalAvatar ? localState.skin : remoteSkin);
      setState((current) => ({
        ...current,
        look: useLocalAvatar ? localState.look : remoteLook,
        skin: useLocalAvatar ? localState.skin : remoteSkin,
        background: useLocalAvatar ? localState.background : remoteBackground,
        config,
        owned: Array.from(new Set([...current.owned, ...keysOf(config)])),
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
      // avatar_look / avatar_skin stay as they were (old index meaning) for the one-time migration.
      let { error } = await supabase
        .from("profiles")
        .update({ avatar_config: state.config, avatar_background: state.background })
        .eq("id", userId);
      if (error && /avatar_config/.test(error.message ?? "")) {
        // supabase/avatar-config.sql not run yet: keep the background in sync at least.
        ({ error } = await supabase.from("profiles").update({ avatar_background: state.background }).eq("id", userId));
      }

      if (error) {
        toastRef.current("Дүрийг найзуудтай синк хийж чадсангүй. Интернэтээ шалгана уу.");
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [avatarSyncReady, loaded, state.config, state.background, userId]);

  // XP нэмэх бүрт түвшин ахисан эсэхийг шалгана
  const reward = (s, amount) => {
    if (amount <= 0) return s;
    const before = levelOf(s.xp);
    const next = { ...s, xp: s.xp + amount, petals: s.petals + amount };
    const after = levelOf(next.xp);
    if (after > before) setTimeout(() => toastRef.current(`${after}-р түвшин! Шинэ хувцас нээгдлээ ✨`), 0);
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
    onToast(`Өдрийн бэлэг: +${DAILY_GIFT} XP, +${DAILY_GIFT} дэлбээ`);
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
    if (level < item.level) return onToast(`${item.level}-р түвшинд нээгдэнэ`), false;
    if (state.petals < item.price) return onToast(`${item.price - state.petals} дэлбээ дутуу байна. Алхаад цуглуулаарай!`), false;
    setState((s) => ({
      ...s,
      petals: s.petals - item.price,
      owned: [...s.owned, id],
      look: { ...s.look, [item.slot]: id },
    }));
    onToast(`«${item.name}» авлаа ✨`);
    return true;
  };

  const equip = (id) => {
    const item = itemById(id);
    if (!item || !state.owned.includes(id)) return;
    setState((s) => ({ ...s, look: { ...s.look, [item.slot]: id } }));
  };

  const setSkin = (skin) => setState((s) => ({ ...s, skin }));

  /* ---------- Layered avatar ---------- */
  const setConfig = (next) => setState((s) => ({ ...s, config: normalizeConfig(next), hasConfig: true }));
  const owns = (key) => isOwned(state.owned, key);

  /** Same rules as buy(): level gate, then 🌸 petals. `key` = "top:hoodie" / "haircolor:pink". */
  const buyKey = (key) => {
    const info = priceOf(key);
    if (!info || owns(key)) return false;
    if (info.seasonal) return onToast("Энэ бол улирлын бэлэг. Тохирох улиралд автоматаар нээгдэнэ 🌸"), false;
    if (level < info.level) return onToast(`${info.level}-р түвшинд нээгдэнэ`), false;
    if (state.petals < info.price) return onToast(`${info.price - state.petals} дэлбээ дутуу байна. Алхаад цуглуулаарай!`), false;
    setState((s) => ({ ...s, petals: s.petals - info.price, owned: [...s.owned, key] }));
    onToast(`«${info.name}» авлаа ✨`);
    return true;
  };

  /** Free seasonal gift; kept forever. Returns true only the first time. */
  const unlockSeasonal = (key) => {
    if (!loaded || owns(key)) return false;
    setState((s) => (s.owned.includes(key) ? s : { ...s, owned: [...s.owned, key] }));
    return true;
  };
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
    setConfig,
    owns,
    buyKey,
    unlockSeasonal,
    setBackground,
    reset,
  };
}
