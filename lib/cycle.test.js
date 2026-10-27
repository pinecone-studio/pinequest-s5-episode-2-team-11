process.env.TZ = "Asia/Ulaanbaatar";

import { describe, expect, it } from "bun:test";
import { getLateStatus, getPrediction, periodsFromLogs } from "./cycle.ts";

const days = (from, count) => Array.from({ length: count }, (_, index) => {
  const [y, m, d] = from.split("-").map(Number);
  const date = new Date(y, m - 1, d + index);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
});

describe("getPrediction", () => {
  it("one logged period → next period predicted 28 days later, for 3 cycles", () => {
    const periods = [{ startDate: "2026-09-10", duration: 4, status: "confirmed" }];
    const prediction = getPrediction(periods, "2026-09-20");
    expect(prediction.cycleLength).toBe(28);
    expect(prediction.periodLength).toBe(4);
    expect(prediction.rangeStart).toBe("2026-10-08");
    expect(prediction.late).toBe(false);
    expect(prediction.overdueDays).toEqual([]);
    expect(prediction.nextStarts).toEqual(["2026-10-08", "2026-11-05", "2026-12-03"]);
    expect(prediction.predictedDays).toEqual([...days("2026-10-08", 4), ...days("2026-11-05", 4), ...days("2026-12-03", 4)]);
  });

  it("defaults period length to 5 when no length was logged", () => {
    expect(getPrediction(["2026-09-10"], "2026-09-20").periodLength).toBe(5);
  });

  it("averages and clamps cycle length", () => {
    expect(getPrediction(["2026-07-01", "2026-07-31", "2026-08-30"], "2026-09-01").cycleLength).toBe(30);
    expect(getPrediction(["2026-06-01", "2026-07-26"], "2026-07-27").cycleLength).toBe(45);
  });

  it("overdue → grey days up to today, late status, later cycles still predicted", () => {
    const periods = [{ startDate: "2026-09-10", duration: 4, status: "confirmed" }];
    const today = "2026-10-27";
    const prediction = getPrediction(periods, today);
    expect(prediction.late).toBe(true);
    expect(prediction.overdueDays).toEqual(days("2026-10-08", 20));
    expect(prediction.overdueDays.at(-1)).toBe(today);
    expect(prediction.nextStarts).toEqual(["2026-11-05", "2026-12-03", "2026-12-31"]);
    expect(prediction.predictedDays.every((date) => date > today)).toBe(true);
    expect(getLateStatus(today, prediction, periods)).toBe("late");
  });

  it("ignores pending guardian entries", () => {
    const periods = periodsFromLogs([
      { log_date: "2026-09-10", status: "confirmed", period_length: 4 },
      { log_date: "2026-10-05", status: "pending", period_length: null },
    ]);
    expect(periods).toEqual([{ startDate: "2026-09-10", duration: 4, status: "confirmed" }]);
    expect(getPrediction(periods, "2026-10-20").rangeStart).toBe("2026-10-08");
  });
});
