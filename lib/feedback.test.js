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

import { nps, summarize, toCsv } from "./feedback-stats.ts";
describe("admin stats", () => {
  it("NPS and percentages, no user ids", () => {
    expect(nps([10, 9, 8, 6, 0])).toBe(0); // 40% promoters − 40% detractors
    expect(nps([10, 10, 9])).toBe(100);
    const stats = summarize(
      [
        { role: "daughter", answers: { smiley: 5, favorite: "friends", embarrassment: "less", embarrassmentWording: "embarrassed", idea: "Илүү хувцас" }, created_at: "2026-10-27T00:00:00Z" },
        { role: "daughter", answers: { smiley: 3, favorite: "today", embarrassment: "same", embarrassmentWording: "embarrassed" }, created_at: "2026-10-26T00:00:00Z" },
        { role: "guardian", answers: { nps: 10, ease: 4, helpedTalk: "yes", trust: 5, pay: "maybe", improve: "Илүү хичээл" }, created_at: "2026-10-28T00:00:00Z" },
      ],
      [{ target_type: "lesson", target_id: "pad-guide", value: "down" }, { target_type: "lesson", target_id: "pad-guide", value: "up" }, { target_type: "lesson", target_id: "guardian-male-guide", value: "up" }],
    );
    expect(stats.daughters).toMatchObject({ responses: 2, avgSmiley: 4, embarrassment: { answered: 2, less: 50, same: 50, more: 0 } });
    expect(stats.guardians).toMatchObject({ nps: 100, avgEase: 4, pay: { maybe: 100 } });
    expect(stats.micro.lessons[0]).toMatchObject({ target: "pad-guide", upRate: 50 }); // lowest first
    expect(stats.freeText.map((row) => row.text)).toEqual(["Илүү хичээл", "Илүү хувцас"]);
    expect(JSON.stringify(stats)).not.toMatch(/user_id/);
    expect(toCsv(stats)).toContain('"guardians","nps","100"');
    expect(toCsv(stats)).not.toContain("Илүү");
  });
});
