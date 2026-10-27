process.env.TZ = "Asia/Ulaanbaatar";

import { describe, expect, it } from "bun:test";
import {
  SAFETY_MOOD, SAFETY_PAIN, forecastUserPrompt, pickForecastTarget, preStats, safetyLines,
  sanitizeStats, statsForTarget, templateForecast, validateForecast,
} from "./forecast.ts";
import { addDaysToLocalDateKey as addDays, getPrediction } from "./cycle.ts";

// 3 past cycles, 28 days apart: tired 2 days before each start, cramps on period day 1.
const STARTS = ["2026-08-04", "2026-09-01", "2026-09-29"];
const PERIODS = STARTS.map((startDate) => ({ startDate, duration: 5 }));
const seededLogs = (starts = STARTS) => starts.flatMap((start) => [
  { log_date: addDays(start, -2), mood: 3, pain: 0, symptoms: ["tired"] },
  { log_date: start, mood: 3, pain: 2, symptoms: ["cramps"] },
]);

describe("pickForecastTarget", () => {
  it("PRE 2 days before the next predicted period", () => {
    const prediction = getPrediction(PERIODS, "2026-10-25");
    expect(prediction.rangeStart).toBe("2026-10-27");
    expect(pickForecastTarget({ today: "2026-10-25", periods: PERIODS, nextStart: prediction.rangeStart, late: prediction.late }))
      .toEqual({ phase: "pre", daysBefore: 2, cycleStart: "2026-09-29" });
  });

  it("PERIOD on a logged period day", () => {
    const periods = [...PERIODS, { startDate: "2026-10-27", duration: 5 }];
    expect(pickForecastTarget({ today: "2026-10-28", periods, nextStart: "2026-11-24", late: false }))
      .toEqual({ phase: "period", day: 2, cycleStart: "2026-10-27" });
  });

  it("nothing mid-cycle or when late", () => {
    expect(pickForecastTarget({ today: "2026-10-10", periods: PERIODS, nextStart: "2026-10-27", late: false })).toBeNull();
    expect(pickForecastTarget({ today: "2026-10-30", periods: PERIODS, nextStart: "2026-10-27", late: true })).toBeNull();
  });
});

describe("forecast stats", () => {
  it("seeded data → PRE card mentions tiredness", () => {
    const stats = statsForTarget({ phase: "pre", daysBefore: 2, cycleStart: "2026-09-29" }, PERIODS, seededLogs());
    expect(stats).toEqual({ phase: "pre", dayLabel: "pre_2", top: ["tired"], avgPain: 0, avgMood: 3, lowMood: false, cyclesUsed: 3 });
    const text = templateForecast(stats);
    expect(text.text).toBe("Өмнө нь сарын тэмдэг ирэхээс 2 хоногийн өмнө чи ядарч байсан. Энэ удаа ч ийм байж магадгүй.");
    expect(text.tip).toBe("Эрт унтаарай 😴");
  });

  it("seeded data → PERIOD day 1 card mentions cramps", () => {
    const periods = [...PERIODS, { startDate: "2026-10-27", duration: 5 }];
    const stats = statsForTarget({ phase: "period", day: 1, cycleStart: "2026-10-27" }, periods, seededLogs());
    expect(stats).toMatchObject({ phase: "period", dayLabel: "period_day_1", top: ["cramps"], avgPain: 2, cyclesUsed: 3 });
    expect(templateForecast(stats).text).toContain("хэвлий чинь өвдөж байсан");
    expect(templateForecast(stats).tip).toBe("Дулаан жин бэлдээрэй 🔥");
  });

  it("fewer than 2 cycles with logs → no stats", () => {
    const logs = seededLogs(["2026-09-29"]);
    expect(statsForTarget({ phase: "pre", daysBefore: 2, cycleStart: "2026-09-29" }, PERIODS, logs)).toBeNull();
  });

  it("falls back from pre_N to the whole pre window", () => {
    const logs = ["2026-09-01", "2026-09-29"].map((start) => ({ log_date: addDays(start, -4), mood: 2, symptoms: ["bloating"] }));
    const stats = statsForTarget({ phase: "pre", daysBefore: 2, cycleStart: "2026-09-29" }, PERIODS, logs);
    expect(stats).toMatchObject({ dayLabel: "pre", top: ["bloating"], lowMood: true, cyclesUsed: 2 });
    expect(templateForecast(stats).text.startsWith("Өмнө нь сарын тэмдэг ирэхийн өмнөх өдрүүдэд")).toBe(true);
  });

  it("keeps items seen in ≥ 2 of 3 cycles, or ≥ 50 % of 2", () => {
    const three = [
      { log_date: addDays(STARTS[0], -1), symptoms: ["acne", "headache"] },
      { log_date: addDays(STARTS[1], -1), symptoms: ["acne"] },
      { log_date: addDays(STARTS[2], -1), symptoms: ["bloating"] },
    ];
    expect(preStats(STARTS, three, 1).top).toEqual(["acne"]);
    expect(preStats(STARTS.slice(1), three, 1).top).toEqual(["acne", "bloating"]);
  });

  it("uses at most the last 3 cycles", () => {
    const starts = ["2026-07-07", ...STARTS];
    expect(preStats(starts, seededLogs(starts), 2).cyclesUsed).toBe(3);
  });
});

describe("safety lines", () => {
  it("strong pain on period days in ≥ 2 cycles", () => {
    const logs = STARTS.slice(1).map((start) => ({ log_date: start, pain: 3 }));
    expect(safetyLines(PERIODS, logs, "2026-10-27")).toEqual([SAFETY_PAIN]);
  });

  it("low mood in every one of the last 3 cycles", () => {
    const logs = STARTS.map((start) => ({ log_date: addDays(start, 10), mood: 1 }));
    expect(safetyLines(PERIODS, logs, "2026-10-27")).toEqual([SAFETY_MOOD]);
    expect(safetyLines(PERIODS, logs.slice(1), "2026-10-27")).toEqual([]);
  });
});

describe("AI output validation", () => {
  const stats = { phase: "pre", dayLabel: "pre_2", top: ["tired"], avgPain: 0, avgMood: 3, lowMood: false, cyclesUsed: 3 };

  it("accepts a good answer and the local template", () => {
    expect(validateForecast({ text: "Өмнө нь 2 хоногийн өмнө чи ядарч байсан. Энэ удаа ч ийм байж магадгүй.", tip: "Эрт унтаарай 😴" }, stats)).not.toBeNull();
    expect(validateForecast(templateForecast(stats), stats)).toEqual(templateForecast(stats));
  });

  it("rejects bad answers", () => {
    const ok = "Өмнө нь чи ядарч байсан. Энэ удаа ч ийм байж магадгүй.";
    expect(validateForecast(null, stats)).toBeNull();
    expect(validateForecast({ text: ok, tip: "Дулаан жин бэлдээрэй 🔥" }, stats)).toBeNull(); // tip doesn't match stats
    expect(validateForecast({ text: ok, tip: "Ус их уу" }, stats)).toBeNull(); // not from the list
    expect(validateForecast({ text: "You were tired before. Энэ удаа магадгүй.", tip: "Эрт унтаарай 😴" }, stats)).toBeNull();
    expect(validateForecast({ text: `${ok} ${"а".repeat(200)}`, tip: "Эрт унтаарай 😴" }, stats)).toBeNull();
    expect(validateForecast({ text: "Өмнө нь чи ядарч байсан. Энэ удаа ч ийм байна.", tip: "Эрт унтаарай 😴" }, stats)).toBeNull(); // no "магадгүй"
    expect(validateForecast({ text: "Парацетамол уугаарай. Магадгүй магадгүй.", tip: "Цүнхэндээ пад хийгээрэй 🎒" }, stats)).toBeNull();
  });
});

describe("AI request payload", () => {
  it("carries only the stats — no name, dates, ids or notes", () => {
    const stats = statsForTarget({ phase: "pre", daysBefore: 2, cycleStart: "2026-09-29" }, PERIODS, seededLogs());
    const payload = { type: "cycle_forecast", stats };
    expect(Object.keys(payload.stats).sort()).toEqual(["avgMood", "avgPain", "cyclesUsed", "dayLabel", "lowMood", "phase", "top"]);
    expect(JSON.stringify(payload)).not.toMatch(/\d{4}-\d{2}-\d{2}/);

    const smuggled = sanitizeStats({ ...stats, name: "Номин", user_id: "abc", note: "нууц", date: "2026-10-25" });
    expect(smuggled).toEqual(stats);
    expect(forecastUserPrompt(smuggled)).not.toMatch(/Номин|abc|нууц|2026/);
  });

  it("rejects stats with too few cycles", () => {
    expect(sanitizeStats({ phase: "pre", dayLabel: "pre_2", top: [], cyclesUsed: 1 })).toBeNull();
  });
});
