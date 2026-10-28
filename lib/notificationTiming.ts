/**
 * When a push may go out, in Asia/Ulaanbaatar time (UTC+8, no DST).
 *   urgent → now
 *   normal → not during school (Mon–Fri 08:00–13:00 → 13:00) or night (21:30–07:30 → 07:30)
 *   quiet  → only 13:00–21:30, otherwise the next 17:00 (or the event's fixed time)
 */
import type { Priority } from "./notificationEvents";

const UB_OFFSET_MS = 8 * 60 * 60 * 1000;
const SCHOOL_START = 8 * 60;
const SCHOOL_END = 13 * 60;
const NIGHT_START = 21 * 60 + 30;
const NIGHT_END = 7 * 60 + 30;
const QUIET_DEFAULT = 17 * 60;

function ubParts(now: Date) {
  const local = new Date(now.getTime() + UB_OFFSET_MS);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    weekday: local.getUTCDay(), // 0 = Sunday
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

/** The UTC instant of `minutes` after midnight, `dayOffset` days from today's Ulaanbaatar date. */
function ubAt(now: Date, dayOffset: number, minutes: number): Date {
  const { year, month, day } = ubParts(now);
  return new Date(Date.UTC(year, month, day + dayOffset, 0, minutes) - UB_OFFSET_MS);
}

/** Today's date in Ulaanbaatar as YYYY-MM-DD, and the UTC instant it starts. */
export function ubDay(now: Date) {
  const { year, month, day } = ubParts(now);
  return { key: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, start: ubAt(now, 0, 0) };
}

/** Returns `now` when it may be sent immediately, otherwise the instant it should wait for. */
export function decideSendTime(priority: Priority, now: Date, fixedTime?: { hour: number; minute: number }): Date {
  if (priority === "urgent") return now;
  const { weekday, minutes } = ubParts(now);

  if (fixedTime) {
    const target = fixedTime.hour * 60 + fixedTime.minute;
    if (minutes < target) return ubAt(now, 0, target);
    // A reminder generated a little late (cron gap) still goes out until the quiet window ends.
    if (minutes < NIGHT_START) return now;
    return ubAt(now, 1, target);
  }

  if (priority === "normal") {
    const schoolDay = weekday >= 1 && weekday <= 5;
    if (schoolDay && minutes >= SCHOOL_START && minutes < SCHOOL_END) return ubAt(now, 0, SCHOOL_END);
    if (minutes >= NIGHT_START) return ubAt(now, 1, NIGHT_END);
    if (minutes < NIGHT_END) return ubAt(now, 0, NIGHT_END);
    return now;
  }

  // quiet
  if (minutes >= SCHOOL_END && minutes < NIGHT_START) return now;
  return minutes < SCHOOL_END ? ubAt(now, 0, QUIET_DEFAULT) : ubAt(now, 1, QUIET_DEFAULT);
}

export const QUIET_PUSHES_PER_DAY = 2;
