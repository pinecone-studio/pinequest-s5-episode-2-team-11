process.env.TZ = "Asia/Ulaanbaatar";

import { describe, expect, it } from "bun:test";
import { groupSelectedPeriodDays, persistPeriodDays, toggleSelectedPeriodDay } from "./period-edit.ts";
import { addDaysToLocalDateKey, dateFromLocalKey, localDateKey, periodsFromLogs } from "./cycle.ts";

// In-memory stand-in for the two Supabase RPCs, mirroring
// supabase/manual-period-date-edit-migration.sql.
function fakeSupabase({ failSync = false } = {}) {
  const rows = new Map();
  const calls = [];
  return {
    calls,
    rows,
    async rpc(fn, args) {
      calls.push({ fn, args });
      if (fn === "sync_my_period_days") {
        if (failSync) return { data: null, error: { code: "PGRST202", message: "Could not find the function" } };
        const groups = groupSelectedPeriodDays(args.p_dates);
        const starts = new Set(groups.map((group) => group.startDate));
        for (const [date, row] of rows) if (row.status === "confirmed" && !starts.has(date)) row.status = "removed";
        for (const group of groups) {
          if (rows.get(group.startDate)?.status === "pending") continue;
          rows.set(group.startDate, { log_date: group.startDate, status: "confirmed", period_length: group.duration });
        }
        return { data: [...starts], error: null };
      }
      if (fn === "get_my_period_logs") {
        const data = [...rows.values()]
          .filter((row) => row.status !== "removed" && row.log_date >= args.p_from && row.log_date <= args.p_to)
          .sort((a, b) => a.log_date.localeCompare(b.log_date))
          .map((row) => ({ ...row }));
        return { data, error: null };
      }
      return { data: null, error: { message: `unknown rpc ${fn}` } };
    },
  };
}

describe("period date editing", () => {
  it("toggles only the tapped day", () => {
    const selected = new Set(["2026-10-12", "2026-10-13"]);

    expect([...toggleSelectedPeriodDay(selected, "2026-10-14")].sort()).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
    ]);
    expect([...toggleSelectedPeriodDay(selected, "2026-10-13")].sort()).toEqual([
      "2026-10-12",
    ]);
    expect([...selected].sort()).toEqual(["2026-10-12", "2026-10-13"]);
  });

  it("splits a period when its middle day is deselected", () => {
    const selected = new Set(["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"]);
    const edited = toggleSelectedPeriodDay(selected, "2026-10-13");

    expect(groupSelectedPeriodDays(edited)).toEqual([
      { startDate: "2026-10-12", duration: 1 },
      { startDate: "2026-10-14", duration: 2 },
    ]);
  });

  it("keeps separate consecutive groups as separate periods", () => {
    expect(groupSelectedPeriodDays([
      "2026-10-12", "2026-10-13", "2026-10-15", "2026-10-16",
    ])).toEqual([
      { startDate: "2026-10-12", duration: 2 },
      { startDate: "2026-10-15", duration: 2 },
    ]);
  });
});

describe("saving period days", () => {
  it("persists one period so it is still there after a reload", async () => {
    const client = fakeSupabase();
    const result = await persistPeriodDays(client, ["2026-09-13", "2026-09-10", "2026-09-11", "2026-09-12"], { today: "2026-10-27", periodLength: 5 });
    expect(result.ok).toBe(true);
    expect(periodsFromLogs(result.rows)).toEqual([{ startDate: "2026-09-10", duration: 4, status: "confirmed" }]);

    // "Reload": a fresh read of the store, as on reopening the calendar.
    const { data } = await client.rpc("get_my_period_logs", { p_from: "2006-01-01", p_to: "2027-12-31" });
    expect(periodsFromLogs(data)).toEqual([{ startDate: "2026-09-10", duration: 4, status: "confirmed" }]);
  });

  it("removes and splits periods in the edited range", async () => {
    const client = fakeSupabase();
    await persistPeriodDays(client, ["2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"], { today: "2026-10-27", periodLength: 5 });
    const result = await persistPeriodDays(client, ["2026-09-10", "2026-09-12", "2026-09-13"], { today: "2026-10-27", periodLength: 5 });
    expect(periodsFromLogs(result.rows)).toEqual([
      { startDate: "2026-09-10", duration: 1, status: "confirmed" },
      { startDate: "2026-09-12", duration: 2, status: "confirmed" },
    ]);
  });

  it("returns the error instead of swallowing it", async () => {
    const result = await persistPeriodDays(fakeSupabase({ failSync: true }), ["2026-09-10"], { today: "2026-10-27", periodLength: 5 });
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("PGRST202");
  });
});

describe("dates in UTC+8", () => {
  it("runs in Asia/Ulaanbaatar", () => {
    expect(new Date(2026, 8, 10).getTimezoneOffset()).toBe(-480);
  });

  it("keeps the calendar day just after local midnight", () => {
    const earlyMorning = new Date(2026, 8, 10, 0, 30);
    expect(localDateKey(earlyMorning)).toBe("2026-09-10");
    // The bug this guards against: toISOString() is UTC and lands a day earlier.
    expect(earlyMorning.toISOString().slice(0, 10)).toBe("2026-09-09");
    expect(localDateKey(dateFromLocalKey("2026-09-10"))).toBe("2026-09-10");
    expect(addDaysToLocalDateKey("2026-09-13", 1)).toBe("2026-09-14");
  });

  it("sends the selected days to the DB exactly as 'YYYY-MM-DD'", async () => {
    const client = fakeSupabase();
    await persistPeriodDays(client, ["2026-09-10", "2026-09-11"], { today: "2026-09-11", periodLength: 5 });
    expect(client.calls[0]).toEqual({ fn: "sync_my_period_days", args: { p_dates: ["2026-09-10", "2026-09-11"], p_period_length: 5 } });
  });
});
