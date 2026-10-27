process.env.TZ = "Asia/Ulaanbaatar";

import { describe, expect, it } from "bun:test";
import { addDaysToLocalDateKey as addDays } from "./cycle.ts";
import { seasonPatterns } from "./patterns.ts";

const CURRENT = "2026-10-20";
const PAST = [84, 56, 28].map((back) => addDays(CURRENT, -back));
const PERIODS = [...PAST, CURRENT].map((startDate) => ({ startDate, duration: 5 }));

describe("seasonPatterns", () => {
  it("groups completed cycles by season with mood, symptoms, skin and sleep", () => {
    const logs = PAST.flatMap((start) => [
      { log_date: start, mood: 2, pain: 2, symptoms: ["cramps", "acne"], skin: ["pimples"], sleepHours: 8 },
      { log_date: addDays(start, 7), mood: 5, symptoms: [], skin: ["normal"], sleepHours: 9.5 },
    ]);
    const { cyclesUsed, seasons } = seasonPatterns(PERIODS, logs, CURRENT);
    expect(cyclesUsed).toBe(3);
    expect(seasons.map((season) => season.season)).toEqual(["winter", "spring"]);
    expect(seasons[0]).toMatchObject({ days: 3, avgMood: 2, avgPain: 2, avgSleep: 8, topSymptoms: ["cramps"], topSkin: ["pimples"] });
    expect(seasons[1]).toMatchObject({ avgMood: 5, avgSleep: 9.5, topSymptoms: [], topSkin: [] });
  });

  it("ignores the current cycle and needs ≥ 2 days per season", () => {
    const logs = [{ log_date: CURRENT, mood: 1 }, { log_date: PAST[2], mood: 3 }];
    expect(seasonPatterns(PERIODS, logs, addDays(CURRENT, 3)).seasons).toEqual([]);
    expect(seasonPatterns([], logs, CURRENT)).toEqual({ cyclesUsed: 0, seasons: [] });
  });
});
