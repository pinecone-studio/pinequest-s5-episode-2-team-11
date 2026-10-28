"use client";

import { useEffect, useMemo } from "react";
import { useFamily } from "../../../context/FamilyContext";
import { getCyclePosition, localDateKey } from "../../../lib/cycle";
import { SEASONAL_TIPS, itemKey, seasonalItem } from "../../../lib/avatar";

/**
 * Bloomy-only seasonal wardrobe: the current cycle season (same logic as the
 * ring) unlocks its item for free, once; it stays owned after the season ends.
 * Returns { season, item, tip } for the card.
 */
export function useSeasonalGift(av) {
  const { view, cyclePeriods, cycleLength, setToast } = useFamily();
  const today = localDateKey(new Date());
  const position = useMemo(() => getCyclePosition(today, cyclePeriods ?? [], { cycleLength }), [today, cyclePeriods, cycleLength]);
  const season = view === "daughter" && position.phase === "cycle" ? position.season : null;
  const item = season ? seasonalItem(season) : null;

  useEffect(() => {
    if (!item || !av.loaded) return;
    if (av.unlockSeasonal(itemKey(item.category, item.id))) setToast(`🎁 Улирлын бэлэг: «${item.name}» нээгдлээ! Шүүгээнээсээ өмсөөрэй`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, av.loaded]);

  return { season, item, tip: season ? SEASONAL_TIPS[season] : null };
}
