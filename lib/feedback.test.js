import { describe, expect, it } from "bun:test";
import { hardDayFromEntries, needsSafetyCard, pickAgainFeature, sanitizeAnswers, shouldPrompt } from "./feedback.ts";

const now = new Date("2026-10-28T04:00:00Z");
const daysAgo = (n) => new Date(now.getTime() - n * 86_400_000).toISOString();

describe("auto prompt timing", () => {
  const base = { first_seen_at: daysAgo(8), last_prompted_at: null, last_submitted_at: null, dismiss_count: 0 };
  it("after 7 days of use, nothing recent, < 3 dismissals", () => {
    expect(shouldPrompt(base, now, false)).toBe(true);
    expect(shouldPrompt({ ...base, first_seen_at: daysAgo(6) }, now, false)).toBe(false);
    expect(shouldPrompt({ ...base, last_submitted_at: daysAgo(29) }, now, false)).toBe(false);
    expect(shouldPrompt({ ...base, last_prompted_at: daysAgo(10) }, now, false)).toBe(false);
    expect(shouldPrompt({ ...base, last_prompted_at: daysAgo(31) }, now, false)).toBe(true);
    expect(shouldPrompt({ ...base, dismiss_count: 3 }, now, false)).toBe(false);
    expect(shouldPrompt(null, now, false)).toBe(false);
  });
  it("never on a hard day", () => {
    expect(shouldPrompt(base, now, true)).toBe(false);
    expect(hardDayFromEntries([{ category: "mood", value: { mood: 2 } }])).toBe(true);
    expect(hardDayFromEntries([{ category: "symptoms", value: { pain: 3, items: [] } }])).toBe(true);
    expect(hardDayFromEntries([{ category: "mood", value: { mood: 4 } }, { category: "symptoms", value: { pain: 1 } }])).toBe(false);
  });
});

describe("answers", () => {
  it("keeps only known values; free text capped", () => {
    expect(sanitizeAnswers("daughter", { smiley: 9, favorite: "friends", again: { feature: "learn", answer: "maybe" }, embarrassment: "less", idea: "x".repeat(400), name: "Номин" }))
      .toEqual({ smiley: null, favorite: "friends", again: { feature: "learn", answer: "maybe" }, embarrassment: "less", embarrassmentWording: "embarrassed", idea: "x".repeat(300) });
    expect(sanitizeAnswers("guardian", { nps: 10, ease: 0, helpedTalk: "some", trust: 4, pay: "yes", improve: "  " }))
      .toEqual({ nps: 10, ease: null, helpedTalk: "some", trust: 4, pay: "yes", improve: null });
  });

  it("again-again asks about a used feature she did not pick", () => {
    expect(pickAgainFeature(["friends", "today"], "friends", () => 0)).toBe("today");
    expect(pickAgainFeature(["friends"], "friends")).toBeNull();
  });

  it("safety words trigger the trusted-adult card", () => {
    expect(needsSafetyCard("намайг зодуулсан")).toBe(true);
    expect(needsSafetyCard("илүү олон хувцас")).toBe(false);
  });
});
