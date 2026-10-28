import { describe, expect, it } from "bun:test";
import { COACHING, COACHING_STEPS, SIGNAL_LABELS } from "./emotionCoaching.js";
import { GUARDIAN_QUIZ } from "./guardianQuiz.js";
import { relationOf, relationWith, relationWord } from "./relation.ts";
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
    expect(relationWord("female")).toBe("Ээж");
    expect(relationWord("male")).toBe("Аав");
    expect(relationWord("unspecified")).toBe("Асран хамгаалагч");
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
