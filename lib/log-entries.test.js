process.env.TZ = "Asia/Ulaanbaatar";

import { describe, expect, it } from "bun:test";
import {
  categoriesByDate, dayLogsFromEntries, isMorning, loggedAtFor, saveEntry, splitByTime, summarizeEntry, ubHour, validEntryValue,
} from "./log-entries.ts";

const entry = (category, value, logged_at, log_date = "2026-10-22") => ({ id: `${category}-${logged_at}`, log_date, category, value, logged_at });

describe("Ulaanbaatar AM/PM", () => {
  it("splits at 12:00 Ulaanbaatar time, not UTC or device time", () => {
    expect(ubHour("2026-10-22T03:59:00Z")).toBe(11); // 11:59 UB
    expect(isMorning("2026-10-22T03:59:00Z")).toBe(true);
    expect(isMorning("2026-10-22T04:00:00Z")).toBe(false); // 12:00 UB → Орой
    expect(isMorning("2026-10-21T16:30:00Z")).toBe(true); // 00:30 UB next day
    expect(isMorning("2026-10-22T09:00:00+08:00")).toBe(true);
  });

  it("orders each column by time", () => {
    const { morning, evening } = splitByTime([
      entry("mood", { mood: 4 }, "2026-10-22T13:00:00Z"),
      entry("sleep", { hours: 9, quality: "good" }, "2026-10-22T00:10:00Z"),
      entry("skin", { items: ["oily"] }, "2026-10-21T23:30:00Z"),
    ]);
    expect(morning.map((item) => item.category)).toEqual(["skin", "sleep"]);
    expect(evening.map((item) => item.category)).toEqual(["mood"]);
  });

  it("past days are logged at 20:00 of that day, today at now", () => {
    expect(loggedAtFor("2026-10-20", "2026-10-22")).toBe("2026-10-20T12:00:00.000Z");
    const now = new Date("2026-10-22T01:00:00Z");
    expect(loggedAtFor("2026-10-22", "2026-10-22", now)).toBe(now.toISOString());
  });
});

describe("summaries", () => {
  it("one line per category, never note text", () => {
    expect(summarizeEntry({ category: "symptoms", value: { pain: 1, items: ["tired"] } })).toBe("Өвдөлт бага, Ядрах");
    expect(summarizeEntry({ category: "skin", value: { items: ["oily", "pimples"] } })).toBe("Тослог, Батга");
    expect(summarizeEntry({ category: "period", value: { flow: "spotting" } })).toBe("Дусал");
    expect(summarizeEntry({ category: "sleep", value: { hours: 8.5, quality: "bad" } })).toBe("8.5 цаг 😣");
    expect(summarizeEntry({ category: "mood", value: { mood: 5 } })).toBe("😄 Маш сайхан");
    expect(summarizeEntry({ category: "note", value: { text: "нууц" } })).toBe("");
  });
});

describe("values", () => {
  it("matches the database rules", () => {
    expect(validEntryValue("mood", { mood: 3 })).toBe(true);
    expect(validEntryValue("mood", { mood: 6 })).toBe(false);
    expect(validEntryValue("skin", { items: [] })).toBe(false);
    expect(validEntryValue("skin", { items: ["acne"] })).toBe(false);
    expect(validEntryValue("symptoms", { pain: 0, items: [] })).toBe(true);
    expect(validEntryValue("symptoms", { pain: null, items: [] })).toBe(false);
    expect(validEntryValue("period", { flow: "spotting" })).toBe(true);
    expect(validEntryValue("sleep", { hours: 9.5, quality: "ok" })).toBe(true);
    expect(validEntryValue("sleep", { hours: 9.3, quality: "ok" })).toBe(false);
    expect(validEntryValue("sleep", { hours: 13, quality: "ok" })).toBe(false);
    expect(validEntryValue("note", { text: "x" })).toBe(false);
  });

  it("refuses future days before touching the database", async () => {
    let called = false;
    const client = { from: () => { called = true; return {}; } };
    const { error } = await saveEntry(client, { userId: "u", date: "2026-10-23", category: "mood", value: { mood: 3 }, today: "2026-10-22" });
    expect(error.message).toBe("future_log_date");
    expect(called).toBe(false);
  });
});

describe("rollups", () => {
  it("calendar dots and per-day summary", () => {
    const entries = [
      entry("mood", { mood: 2 }, "2026-10-22T01:00:00Z"),
      entry("mood", { mood: 4 }, "2026-10-22T12:00:00Z"),
      entry("symptoms", { pain: 1, items: ["tired"] }, "2026-10-22T02:00:00Z"),
      entry("symptoms", { pain: 2, items: ["cramps"] }, "2026-10-22T11:00:00Z"),
      entry("skin", { items: ["pimples"] }, "2026-10-22T03:00:00Z"),
      entry("sleep", { hours: 7, quality: "bad" }, "2026-10-21T23:00:00Z", "2026-10-21"),
    ];
    const dots = categoriesByDate(entries);
    expect([...dots["2026-10-22"]].sort()).toEqual(["mood", "skin", "symptoms"]);
    expect([...dots["2026-10-21"]]).toEqual(["sleep"]);
    const [day21, day22] = dayLogsFromEntries(entries);
    expect(day21).toMatchObject({ log_date: "2026-10-21", sleepHours: 7, mood: null });
    expect(day22).toMatchObject({ mood: 4, pain: 2, skin: ["pimples"] });
    expect(day22.symptoms.sort()).toEqual(["acne", "cramps", "tired"]);
  });
});
