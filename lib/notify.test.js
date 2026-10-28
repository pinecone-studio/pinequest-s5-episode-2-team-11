import { describe, expect, it } from "bun:test";
import { EVENTS, LOCK_SCREEN_FORBIDDEN, eventConfig } from "./notificationEvents.ts";
import { decideSendTime, ubDay } from "./notificationTiming.ts";
import { DEFAULT_PREFS, planRecipient } from "./notify.ts";

// Ulaanbaatar is UTC+8: "2026-10-28T10:00 UB" = 02:00Z. 2026-10-28 is a Wednesday.
const ub = (local) => new Date(`${local}:00+08:00`);
const iso = (date) => date.toISOString();

describe("timing (Asia/Ulaanbaatar)", () => {
  it("urgent always goes now", () => {
    expect(iso(decideSendTime("urgent", ub("2026-10-28T03:00")))).toBe(iso(ub("2026-10-28T03:00")));
  });

  it("normal waits for the end of school on weekdays", () => {
    expect(iso(decideSendTime("normal", ub("2026-10-28T10:00")))).toBe(iso(ub("2026-10-28T13:00")));
    expect(iso(decideSendTime("normal", ub("2026-10-31T10:00")))).toBe(iso(ub("2026-10-31T10:00"))); // Saturday
    expect(iso(decideSendTime("normal", ub("2026-10-28T13:00")))).toBe(iso(ub("2026-10-28T13:00")));
  });

  it("normal waits out the night", () => {
    expect(iso(decideSendTime("normal", ub("2026-10-28T22:00")))).toBe(iso(ub("2026-10-29T07:30")));
    expect(iso(decideSendTime("normal", ub("2026-10-28T06:00")))).toBe(iso(ub("2026-10-28T07:30")));
    expect(iso(decideSendTime("normal", ub("2026-10-28T07:45")))).toBe(iso(ub("2026-10-28T07:45")));
  });

  it("quiet only 13:00–21:30, otherwise the next 17:00", () => {
    expect(iso(decideSendTime("quiet", ub("2026-10-28T15:00")))).toBe(iso(ub("2026-10-28T15:00")));
    expect(iso(decideSendTime("quiet", ub("2026-10-28T09:00")))).toBe(iso(ub("2026-10-28T17:00")));
    expect(iso(decideSendTime("quiet", ub("2026-10-28T21:45")))).toBe(iso(ub("2026-10-29T17:00")));
  });

  it("fixed-time reminders", () => {
    const diary = eventConfig("diary_reminder").fixedTime;
    expect(iso(decideSendTime("quiet", ub("2026-10-28T09:00"), diary))).toBe(iso(ub("2026-10-28T20:00")));
    expect(iso(decideSendTime("quiet", ub("2026-10-28T20:10"), diary))).toBe(iso(ub("2026-10-28T20:10")));
    expect(iso(decideSendTime("quiet", ub("2026-10-28T22:00"), diary))).toBe(iso(ub("2026-10-29T20:00")));
  });

  it("Ulaanbaatar day boundary", () => {
    expect(ubDay(new Date("2026-10-27T16:30:00Z")).key).toBe("2026-10-28");
    expect(iso(ubDay(new Date("2026-10-28T02:00:00Z")).start)).toBe("2026-10-27T16:00:00.000Z");
  });
});

describe("planRecipient", () => {
  const now = ub("2026-10-28T10:00");
  it("friend SOS pushes now even with friends notifications off", () => {
    const plan = planRecipient({ cfg: eventConfig("friend_sos"), prefs: { ...DEFAULT_PREFS, friends_enabled: false }, now, quietPushedToday: 0 });
    expect(plan).toEqual({ status: "pending", sendAfter: now, push: true });
  });

  it("normal at 10:00 on a weekday is deferred to 13:00", () => {
    const plan = planRecipient({ cfg: eventConfig("supply_request"), prefs: DEFAULT_PREFS, now, quietPushedToday: 0 });
    expect(plan.status).toBe("deferred");
    expect(iso(plan.sendAfter)).toBe(iso(ub("2026-10-28T13:00")));
  });

  it("toggle off → inbox only; due deferred rows send now", () => {
    expect(planRecipient({ cfg: eventConfig("supply_request"), prefs: { ...DEFAULT_PREFS, guardian_enabled: false }, now, quietPushedToday: 0 }))
      .toMatchObject({ status: "sent", push: false });
    expect(planRecipient({ cfg: eventConfig("supply_request"), prefs: DEFAULT_PREFS, now, quietPushedToday: 0, due: true }))
      .toMatchObject({ status: "pending", push: true });
  });

  it("max 2 quiet pushes a day, then inbox only", () => {
    const afternoon = ub("2026-10-28T15:00");
    expect(planRecipient({ cfg: eventConfig("friend_added"), prefs: DEFAULT_PREFS, now: afternoon, quietPushedToday: 1 }).push).toBe(true);
    expect(planRecipient({ cfg: eventConfig("friend_added"), prefs: DEFAULT_PREFS, now: afternoon, quietPushedToday: 2 })).toMatchObject({ status: "sent", push: false });
  });

  it("inbox-only events never push", () => {
    expect(planRecipient({ cfg: eventConfig("sent_copy"), prefs: DEFAULT_PREFS, now, quietPushedToday: 0 }).push).toBe(false);
  });
});

describe("lock-screen text", () => {
  it("never contains sensitive words", () => {
    const data = { senderName: "Номин", senderId: "u1", detail: "сарын тэмдэг ирлээ, пад хэрэгтэй" };
    for (const [name, cfg] of Object.entries(EVENTS)) {
      const text = `${cfg.title(data)} ${cfg.body(data)}`;
      expect({ name, bad: LOCK_SCREEN_FORBIDDEN.test(text) }).toEqual({ name, bad: false });
    }
    expect(LOCK_SCREEN_FORBIDDEN.test("Цүнхэндээ пад хийгээрэй")).toBe(true);
    expect(LOCK_SCREEN_FORBIDDEN.test("Сарын тэмдэг")).toBe(true);
  });

  it("repeats of the same kind share a group key (collapse on the phone)", () => {
    const data = { senderId: "girl-1", senderName: "Номин" };
    expect(EVENTS.supply_request.groupKey(data)).toBe(EVENTS.supply_request.groupKey({ ...data, detail: "other" }));
    expect(EVENTS.friend_sos.groupKey(data)).toBe("sos_girl-1");
  });
});

import { relativeTimeMn } from "./relative-time.js";
describe("relativeTimeMn", () => {
  const now = new Date("2026-10-28T10:00:00Z");
  it("formats in Mongolian", () => {
    expect(relativeTimeMn("2026-10-28T09:59:40Z", now)).toBe("Дөнгөж сая");
    expect(relativeTimeMn("2026-10-28T09:55:00Z", now)).toBe("5 минутын өмнө");
    expect(relativeTimeMn("2026-10-28T08:00:00Z", now)).toBe("2 цагийн өмнө");
    expect(relativeTimeMn("2026-10-27T09:00:00Z", now)).toBe("Өчигдөр");
    expect(relativeTimeMn("2026-10-25T09:00:00Z", now)).toBe("3 өдрийн өмнө");
  });
});
