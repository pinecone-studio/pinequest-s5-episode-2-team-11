"use client";

/**
 * useAvatar — дүрийн XP, 🌸 дэлбээ, хувцас, алхалт.
 * ДЕМО: өгөгдөл энэ утасны localStorage-д хадгалагдана (Supabase-гүй).
 * Жинхэнэ апп болоход энэ файлыг л Supabase руу шилжүүлнэ — дэлгэцүүд өөрчлөгдөхгүй.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DAILY_GIFT,
  REWARD_PER_STEP_BLOCK,
  START_PETALS,
  STARTER_LOOK,
  STARTER_OWNED,
  STEPS_PER_REWARD,
  WALK_XP_DAILY_CAP,
  itemById,
  levelOf,
} from "../../../lib/wardrobe";

const today = () => new Date().toISOString().slice(0, 10);

const fresh = () => ({
  xp: 0,
  petals: START_PETALS,
  skin: 0,
  owned: STARTER_OWNED,
  look: STARTER_LOOK,
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
      owned: Array.from(new Set([...STARTER_OWNED, ...(saved.owned ?? [])])),
      look: { ...STARTER_LOOK, ...(saved.look ?? {}) },
    };
  } catch {
    return fresh();
  }
};

export function useAvatar(userId, onToast = () => {}) {
  const key = `bloomy:avatar:${userId || "guest"}`;
  const [state, setState] = useState(fresh);
  const [loaded, setLoaded] = useState(false);
  const toastRef = useRef(onToast);
  toastRef.current = onToast;

  useEffect(() => {
    setState(read(key));
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, loaded, state]);

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

  const reset = () => setState(fresh());

  return {
    ...state,
    loaded,
    level,
    walkToday,
    giftReady,
    addSteps,
    claimGift,
    buy,
    equip,
    setSkin,
    reset,
  };
}
