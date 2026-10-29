import { describe, expect, it } from "bun:test";
import { COACHING, COACHING_STEPS, SIGNAL_LABELS } from "./emotionCoaching.js";
import { GUARDIAN_QUIZ } from "./guardianQuiz.js";
import { GUARDIAN_RELATION, relationOf, relationWith } from "./relation.ts";
import { EVENTS, TALK_REPLIES } from "./notificationEvents.ts";

describe("guardian quiz", () => {
  it("10 draft cards with a boolean answer and an explanation", () => {
    expect(GUARDIAN_QUIZ).toHaveLength(10);
    for (const card of GUARDIAN_QUIZ) {
      expect(card.draft).toBe(true);
      expect(typeof card.answer).toBe("boolean");
      expect(card.explain.length).toBeGreaterThan(10);
    }
    expect(GUARDIAN_QUIZ.find((card) => card.id === "bath").answer).toBe(false);
    expect(GUARDIAN_QUIZ.find((card) => card.id === "pain").answer).toBe(false);
  });
});

describe("emotion coaching", () => {
  it("every signal type has say/avoid for all 5 steps", () => {
    expect(COACHING_STEPS).toHaveLength(5);
    for (const type of Object.keys(SIGNAL_LABELS)) {
      expect(COACHING[type]).toHaveLength(5);
      for (const step of COACHING[type]) expect(step.say && step.avoid).toBeTruthy();
    }
  });
});

describe("relation words", () => {
  it("uses the right case endings", () => {
    expect(GUARDIAN_RELATION).toBe("Асран хамгаалагч");
    expect(relationOf("Аав")).toBe("Аавын");
    expect(relationWith("Ээж")).toBe("Ээжтэйгээ");
  });

  it("talk reply lock-screen lines come from the fixed list", () => {
    expect(EVENTS.talk_reply.body({ relation: "Ээж", variant: "now" })).toBe("Ээж чинь одоо ирж байна 💗");
    expect(EVENTS.talk_reply.body({ relation: "Ээж", variant: "nope", detail: "anything" })).toBe("Хариу ирлээ 💗");
    expect(Object.keys(TALK_REPLIES)).toEqual(["now", "later", "tonight"]);
    expect(EVENTS.guardian_story.body({ relation: "Аав" })).toBe("Аав чинь чамд нэг түүх үлдээлээ 💌");
  });
});

import { isReflectionTime, pickGoal, streak, weekStart } from "./reflection.ts";
describe("weekly reflection (Ulaanbaatar time)", () => {
  it("Sunday 18:00+ only", () => {
    expect(isReflectionTime(new Date("2026-11-01T10:00:00Z"))).toBe(true); // Sun 18:00 UB
    expect(isReflectionTime(new Date("2026-11-01T09:59:00Z"))).toBe(false); // Sun 17:59
    expect(isReflectionTime(new Date("2026-10-31T12:00:00Z"))).toBe(false); // Sat 20:00
    expect(isReflectionTime(new Date("2026-11-01T16:30:00Z"))).toBe(false); // already Monday 00:30 UB
  });
  it("week starts on Monday; Sunday evening belongs to its week", () => {
    expect(weekStart(new Date("2026-11-01T12:00:00Z"))).toBe("2026-10-26");
    expect(weekStart(new Date("2026-10-26T01:00:00Z"))).toBe("2026-10-26");
  });
  it("goal follows the answers; 4-week streak", () => {
    expect(pickGoal({ listened: "no", warm: "yes" }, "2026-10-26")).toMatch(/сонс/);
    expect(pickGoal({ listened: "yes", warm: "sometimes" }, "2026-10-26")).toMatch(/Чамаар бахархаж|захидал/);
    const now = new Date("2026-11-01T12:00:00Z");
    expect(streak(["2026-10-26", "2026-10-19", "2026-10-05", "2026-09-28"], now)).toBe(3);
  });
});
