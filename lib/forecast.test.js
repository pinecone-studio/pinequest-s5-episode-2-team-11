process.env.TZ = "Asia/Ulaanbaatar";

import { describe, expect, it } from "bun:test";
import {
  LOG_MORE_HINT, POSITIVE_TIPS, PREP_TIPS, SAFETY_MOOD, SAFETY_PAIN, SEASON_TEXT, allowedTips, forecastTitle, forecastUserPrompt,
  isGoodPattern, prepTipFor, safetyLines, sanitizeStats, statsForPosition, templateForecast, validateForecast,
} from "./forecast.ts";
import { addDaysToLocalDateKey as addDays, getCyclePosition, getSeason, getPrediction } from "./cycle.ts";

// Same shape as scripts/seed-forecast.ts: 3 completed 28-day cycles + the current one.
const CURRENT = "2026-10-20";
const PAST = [84, 56, 28].map((back) => addDays(CURRENT, -back));
const PERIODS = [...PAST, CURRENT].map((startDate) => ({ startDate, duration: 5 }));
const seededLogs = (starts = PAST) => starts.flatMap((start) => [
  { log_date: start, mood: 3, pain: 2, symptoms: ["cramps"] },
  { log_date: addDays(start, 1), mood: 3, pain: 1, symptoms: ["cramps"] },
  { log_date: addDays(start, 7), mood: 5, pain: 0, symptoms: [] },
  { log_date: addDays(start, 17), mood: 5, pain: 0, symptoms: [] },
  { log_date: addDays(start, 26), mood: 3, pain: 0, symptoms: ["tired"] },
]);
const onDay = (day, periods = PERIODS) => getCyclePosition(addDays(CURRENT, day - 1), periods, { cycleLength: 28 });
const statsOn = (day, logs = seededLogs()) => statsForPosition(onDay(day), PERIODS, logs);

describe("cycle position (shared with the ring)", () => {
  it("season, cycle day and days until next", () => {
    expect(onDay(1)).toMatchObject({ phase: "cycle", season: "winter", cycleDay: 1, cycleStart: CURRENT, late: false });
    expect(onDay(8).season).toBe("spring");
    expect(onDay(15).season).toBe("summer");
    expect(onDay(27)).toMatchObject({ season: "autumn", daysUntilNext: 2 });
  });

  it("uses the same season as getSeason with the ring's inputs", () => {
    for (let day = 1; day <= 28; day += 1) {
      const today = addDays(CURRENT, day - 1);
      const prediction = getPrediction(PERIODS, today);
      const ringSeason = getSeason(today, { periods: PERIODS, cycleLength: 28, periodLength: prediction.periodLength, prediction });
      expect(onDay(day).season).toBe(ringSeason);
    }
  });

  it("before the first period", () => {
    expect(getCyclePosition(CURRENT, [])).toEqual({ phase: "before_first" });
  });
});

describe("levels", () => {
  it("winter day 1 → Level 1, cramps", () => {
    const stats = statsOn(1);
    expect(stats).toEqual({ season: "winter", level: 1, dayLabel: "day_1", top: ["cramps"], avgPain: 1.5, avgMood: 3, lowMood: false, cyclesUsed: 3 });
    expect(templateForecast(stats)).toEqual({
      text: "Өмнө нь сарын тэмдгийн 1 дэх өдөр хэвлий чинь өвдөж байсан. Өнөөдөр ч ийм байж магадгүй.",
      tip: "Дулаан жин бэлдээрэй 🔥",
    });
  });

  it("spring day 8 → Level 1, positive", () => {
    const stats = statsOn(8);
    expect(stats).toMatchObject({ season: "spring", level: 1, dayLabel: "day_8", top: [], avgMood: 5 });
    expect(isGoodPattern(stats)).toBe(true);
    expect(templateForecast(stats)).toEqual({
      text: "Өмнө нь мөчлөгийн 8 дэх өдөр чи сэтгэл сайхан, эрч хүчтэй байсан. Өнөөдөр ч ийм байж магадгүй.",
      tip: POSITIVE_TIPS[0],
    });
  });

  it("summer day 15 → Level 2 (only the season matches), positive", () => {
    const stats = statsOn(15);
    expect(stats).toMatchObject({ season: "summer", level: 2, dayLabel: "day_15", top: [], avgMood: 5, cyclesUsed: 3 });
    expect(templateForecast(stats).text).toBe("Зуны үед чи ихэвчлэн сэтгэл сайхан, эрч хүчтэй байдаг. Өнөөдөр ч ийм байж магадгүй.");
    expect(POSITIVE_TIPS).toContain(templateForecast(stats).tip);
  });

  it("winter day 4 → Level 2 from period days", () => {
    expect(statsOn(4)).toMatchObject({ season: "winter", level: 2, top: ["cramps"] });
    expect(templateForecast(statsOn(4)).text.startsWith("Өвлийн үед хэвлий чинь ихэвчлэн өвддөг.")).toBe(true);
  });

  it("autumn aligns by days before the next start", () => {
    const stats = statsOn(27);
    expect(stats).toMatchObject({ season: "autumn", level: 1, dayLabel: "before_2", top: ["tired"] });
    expect(templateForecast(stats).text).toBe("Өмнө нь сарын тэмдэг ирэхээс 2 хоногийн өмнө чи ядарч байсан. Өнөөдөр ч ийм байж магадгүй.");
    // A longer previous cycle still lines up 2 days before its own next start.
    const uneven = [PAST[0], addDays(PAST[1], -3), PAST[2], CURRENT].map((startDate) => ({ startDate, duration: 5 }));
    const logs = uneven.slice(0, 3).map((period, index) => ({ log_date: addDays(uneven[index + 1].startDate, -2), symptoms: ["tired"] }));
    expect(statsForPosition(onDay(27, uneven), uneven, logs)).toMatchObject({ level: 1, top: ["tired"], cyclesUsed: 3 });
  });

  it("no logs → Level 3 (null)", () => {
    for (const day of [1, 8, 15, 27]) expect(statsOn(day, [])).toBeNull();
  });

  it("logs in only one past cycle → Level 3", () => {
    expect(statsOn(1, seededLogs([PAST[2]]))).toBeNull();
  });

  it("today's own logs never change today's stats", () => {
    const today = addDays(CURRENT, 7);
    const withToday = [...seededLogs(), { log_date: today, mood: 1, pain: 3, symptoms: ["headache"] }];
    expect(statsOn(8, withToday)).toEqual(statsOn(8));
  });
});

describe("titles and local text", () => {
  it("titles by season", () => {
    expect(forecastTitle(onDay(2))).toBe("❄️ Өвөл · Сарын тэмдгийн 2 дэх өдөр");
    expect(forecastTitle(onDay(8))).toBe("🌱 Хавар · 8 дэх өдөр");
    expect(forecastTitle(onDay(15))).toBe("☀️ Зун · 15 дэх өдөр");
    expect(forecastTitle(onDay(27))).toBe("🍂 Намар · Сарын тэмдэг 2 хоногийн дараа");
    expect(forecastTitle({ phase: "before_first" })).toBe("🌱 Бэлтгэл үе");
  });

  it("level 3 season text and hint", () => {
    expect(SEASON_TEXT.autumn).toContain("Цүнхэндээ пад хийгээрэй 🎒");
    expect(LOG_MORE_HINT).toBe("🌱 Тэмдэглэх тусам зөвлөгөө чамд илүү тохирох болно");
  });

  it("before-first tip rotates daily", () => {
    const tips = Array.from({ length: PREP_TIPS.length }, (_, index) => prepTipFor(addDays(CURRENT, index)));
    expect(new Set(tips).size).toBe(PREP_TIPS.length);
    expect(prepTipFor(CURRENT)).toBe(prepTipFor(CURRENT));
  });
});

describe("safety lines", () => {
  it("strong pain on period days in ≥ 2 cycles", () => {
    const logs = PAST.slice(1).map((start) => ({ log_date: start, pain: 3 }));
    expect(safetyLines(PERIODS, logs, CURRENT)).toEqual([SAFETY_PAIN]);
  });

  it("low mood in every one of the last 3 cycles", () => {
    const logs = PAST.map((start) => ({ log_date: addDays(start, 10), mood: 1 }));
    expect(safetyLines(PERIODS, logs, CURRENT)).toEqual([SAFETY_MOOD]);
    expect(safetyLines(PERIODS, logs.slice(1), CURRENT)).toEqual([]);
  });
});

describe("AI output validation", () => {
  const stats = { season: "autumn", level: 1, dayLabel: "before_2", top: ["tired"], avgPain: 0, avgMood: 3, lowMood: false, cyclesUsed: 3 };

  it("accepts a good answer and every template", () => {
    expect(validateForecast({ text: "Өмнө нь 2 хоногийн өмнө чи ядарч байсан. Өнөөдөр ч ийм байж магадгүй.", tip: "Эрт унтаарай 😴" }, stats)).not.toBeNull();
    for (const day of [1, 4, 8, 15, 27]) {
      const seasonStats = statsOn(day);
      expect(validateForecast(templateForecast(seasonStats), seasonStats)).toEqual(templateForecast(seasonStats));
    }
  });

  it("positive tips only for a good pattern or when nothing else fits", () => {
    expect(allowedTips(stats)).toEqual(["Эрт унтаарай 😴", "Цүнхэндээ пад хийгээрэй 🎒"]);
    expect(allowedTips(statsOn(8))).toEqual(POSITIVE_TIPS);
  });

  it("rejects bad answers", () => {
    const ok = "Өмнө нь чи ядарч байсан. Өнөөдөр ч ийм байж магадгүй.";
    expect(validateForecast(null, stats)).toBeNull();
    expect(validateForecast({ text: ok, tip: "Дулаан жин бэлдээрэй 🔥" }, stats)).toBeNull(); // tip doesn't match stats
    expect(validateForecast({ text: ok, tip: POSITIVE_TIPS[0] }, stats)).toBeNull(); // not a good pattern
    expect(validateForecast({ text: ok, tip: "Ус их уу" }, stats)).toBeNull(); // not from the list
    expect(validateForecast({ text: "You were tired before. Энэ удаа магадгүй.", tip: "Эрт унтаарай 😴" }, stats)).toBeNull();
    expect(validateForecast({ text: `${ok} ${"а".repeat(200)}`, tip: "Эрт унтаарай 😴" }, stats)).toBeNull();
    expect(validateForecast({ text: "Өмнө нь чи ядарч байсан. Өнөөдөр ч ийм байна.", tip: "Эрт унтаарай 😴" }, stats)).toBeNull(); // no "магадгүй"
    expect(validateForecast({ text: "Парацетамол уугаарай. Магадгүй магадгүй.", tip: "Цүнхэндээ пад хийгээрэй 🎒" }, stats)).toBeNull();
  });
});

describe("AI request payload", () => {
  it("carries only the stats — no name, dates, ids or notes", () => {
    const stats = statsOn(27);
    const payload = { type: "cycle_forecast", stats };
    expect(Object.keys(payload.stats).sort()).toEqual(["avgMood", "avgPain", "cyclesUsed", "dayLabel", "level", "lowMood", "season", "top"]);
    expect(JSON.stringify(payload)).not.toMatch(/\d{4}-\d{2}-\d{2}/);

    const smuggled = sanitizeStats({ ...stats, name: "Номин", user_id: "abc", note: "нууц", date: "2026-10-25" });
    expect(smuggled).toEqual(stats);
    expect(forecastUserPrompt(smuggled)).not.toMatch(/Номин|abc|нууц|2026/);
  });

  it("rejects level 3, unknown seasons and too few cycles", () => {
    const stats = statsOn(27);
    expect(sanitizeStats({ ...stats, level: 3 })).toBeNull();
    expect(sanitizeStats({ ...stats, season: "monsoon" })).toBeNull();
    expect(sanitizeStats({ ...stats, dayLabel: "2026-10-25" })).toBeNull();
    expect(sanitizeStats({ ...stats, cyclesUsed: 1 })).toBeNull();
  });
});
