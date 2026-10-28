/**
 * Feedback: survey answers (validated on the server), the auto-prompt timing
 * rule, and the safety-word check for free text. Shared by /api/feedback,
 * the survey sheets, and tests. No personal questions for children.
 */
import { CHAT_TOPICS } from "./chat-replies";

export type Role = "daughter" | "guardian";

export const FEATURES = [
  { id: "helper", label: "Туслах", emoji: "💬" },
  { id: "friends", label: "Найзууд", emoji: "👭" },
  { id: "today", label: "Өнөөдөр", emoji: "🌸" },
  { id: "learn", label: "Сурах", emoji: "📚" },
  { id: "avatar", label: "Миний дүр", emoji: "👧" },
] as const;
export type FeatureId = (typeof FEATURES)[number]["id"];
const FEATURE_IDS = FEATURES.map((feature) => feature.id) as string[];
export const featureLabel = (id: string) => FEATURES.find((feature) => feature.id === id)?.label ?? id;

export const SMILEYS = [{ value: 1, emoji: "😣" }, { value: 2, emoji: "🙁" }, { value: 3, emoji: "😐" }, { value: 4, emoji: "🙂" }, { value: 5, emoji: "😍" }];
export const AGAIN = [["yes", "Тийм"], ["maybe", "Магадгүй"], ["no", "Үгүй"]] as const;
export const EMBARRASSMENT = [["less", "Багассан 🌸"], ["same", "Адилхан"], ["more", "Нэмэгдсэн"]] as const;
export const HELPED = [["yes", "Тийм"], ["some", "Бага зэрэг"], ["no", "Үгүй"]] as const;
export const PAY = [["yes", "Тийм"], ["maybe", "Магадгүй"], ["no", "Үгүй"]] as const;
export const EASE_LABELS = ["Маш хэцүү", "Хэцүү", "Дунд зэрэг", "Амар", "Маш амар"];
export const DAUGHTER_IDEA_MAX = 300;
export const GUARDIAN_IMPROVE_MAX = 500;

/** "Again-Again": one feature she has used but did not pick as favourite, at random. */
export function pickAgainFeature(used: string[], favorite: string | null, random = Math.random): FeatureId | null {
  const options = used.filter((id) => FEATURE_IDS.includes(id) && id !== favorite);
  return options.length ? (options[Math.floor(random() * options.length)] as FeatureId) : null;
}

/** `value` if it is one of the allowed ids (plain list or [id, label] pairs), else null. */
const oneOf = (value: unknown, allowed: readonly unknown[]): any => {
  const ids = allowed.map((item) => (Array.isArray(item) ? item[0] : item));
  return ids.includes(value) ? value : null;
};
const intIn = (value: unknown, min: number, max: number) => (Number.isInteger(value) && (value as number) >= min && (value as number) <= max ? (value as number) : null);
const text = (value: unknown, max: number) => (typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null);

export type DaughterAnswers = {
  smiley: number | null;
  favorite: FeatureId | null;
  again: { feature: FeatureId; answer: "yes" | "maybe" | "no" | null } | null;
  embarrassment: "less" | "same" | "more" | null;
  embarrassmentWording: "embarrassed" | "worried";
  idea: string | null;
};
export type GuardianAnswers = {
  nps: number | null;
  ease: number | null;
  helpedTalk: "yes" | "some" | "no" | null;
  trust: number | null;
  pay: "yes" | "maybe" | "no" | null;
  improve: string | null;
};

/** Keeps only known fields and values; anything else is dropped. */
export function sanitizeAnswers(role: Role, raw: any): DaughterAnswers | GuardianAnswers {
  const value = raw && typeof raw === "object" ? raw : {};
  if (role === "daughter") {
    const againFeature = oneOf(value.again?.feature, FEATURE_IDS);
    return {
      smiley: intIn(value.smiley, 1, 5),
      favorite: oneOf(value.favorite, FEATURE_IDS),
      again: againFeature ? { feature: againFeature, answer: oneOf(value.again?.answer, AGAIN) } : null,
      embarrassment: oneOf(value.embarrassment, EMBARRASSMENT),
      embarrassmentWording: value.embarrassmentWording === "worried" ? "worried" : "embarrassed",
      idea: text(value.idea, DAUGHTER_IDEA_MAX),
    };
  }
  return {
    nps: intIn(value.nps, 0, 10),
    ease: intIn(value.ease, 1, 5),
    helpedTalk: oneOf(value.helpedTalk, HELPED),
    trust: intIn(value.trust, 1, 5),
    pay: oneOf(value.pay, PAY),
    improve: text(value.improve, GUARDIAN_IMPROVE_MAX),
  };
}

/** Same danger / urgent words as Блүми эгч; a match shows the trusted-adult card (nobody is notified). */
const SAFETY_KEYS = CHAT_TOPICS.filter((topic: { id: string }) => topic.id === "danger" || topic.id === "urgent").flatMap((topic: { keys: string[] }) => topic.keys);
export const needsSafetyCard = (value: string | null | undefined) => {
  const lower = (value ?? "").toLowerCase();
  return Boolean(lower) && SAFETY_KEYS.some((key: string) => lower.includes(key));
};

export type FeedbackState = { first_seen_at: string | null; last_prompted_at: string | null; last_submitted_at: string | null; dismiss_count: number | null } | null;
const DAY_MS = 86_400_000;

/** Auto prompt: used ≥ 7 days, nothing in the last 30 days, dismissed < 3 times, and not a hard day. */
export function shouldPrompt(state: FeedbackState, now: Date, hardDay: boolean): boolean {
  if (hardDay || !state?.first_seen_at) return false;
  const since = (iso: string | null) => (iso ? now.getTime() - new Date(iso).getTime() : Infinity);
  return since(state.first_seen_at) >= 7 * DAY_MS
    && since(state.last_submitted_at) >= 30 * DAY_MS
    && since(state.last_prompted_at) >= 30 * DAY_MS
    && (state.dismiss_count ?? 0) < 3;
}

/** A logged day counts as hard with mood ≤ 2 or pain "Их" (3). */
export function hardDayFromEntries(entries: { category: string; value: any }[]): boolean {
  return entries.some((entry) => (entry.category === "mood" && Number(entry.value?.mood) <= 2) || (entry.category === "symptoms" && Number(entry.value?.pain) === 3));
}
