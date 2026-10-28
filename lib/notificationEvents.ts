/**
 * Every notification event in one place: who gets it, how urgent it is, and
 * the lock-screen text. Lock-screen title/body must stay neutral (no period,
 * pad or pain words); details go into the in-app `text` only.
 */
export type Priority = "urgent" | "normal" | "quiet";
export type PrefKey = "friends_enabled" | "guardian_enabled" | "reminders_enabled" | "diary_reminder";
export type Audience = "friends" | "guardians" | "daughter" | "self";
export type NotifyData = { senderId?: string | null; senderName?: string | null; detail?: string | null; url?: string | null };

export type EventConfig = {
  audience: Audience;
  priority: Priority;
  icon: string;
  title: (data: NotifyData) => string;
  body: (data: NotifyData) => string;
  url: string;
  groupKey: (data: NotifyData) => string;
  /** Recipient toggle that silences the push (the inbox row is still created). */
  pref?: PrefKey;
  /** Recipient must have this on, otherwise nothing is created at all. */
  requirePref?: PrefKey;
  /** Emergencies: ignore the recipient toggles. */
  alwaysPush?: boolean;
  /** Quiet reminders with a fixed Ulaanbaatar time. */
  fixedTime?: { hour: number; minute: number };
  /** Inbox only (never a push). */
  push?: boolean;
  /** At most one per sender per N minutes. */
  rateLimitMinutes?: number;
  /** Guardian events that need the daughter's permission. */
  permission?: "share_mood";
  /** Can a signed-in user trigger it through /api/notify (vs. server/cron only)? */
  client: boolean;
};

const name = (data: NotifyData) => (data.senderName || "").trim() || "Найз";
const sender = (data: NotifyData) => data.senderId ?? "";

export const EVENTS = {
  // ---------- Friends ----------
  friend_sos: {
    audience: "friends", priority: "urgent", icon: "🆘", client: true, alwaysPush: true, rateLimitMinutes: 10,
    title: () => "Bloomy 💗", body: (d) => `${name(d)} чамаас тусламж хүсч байна`, url: "/friends", groupKey: (d) => `sos_${sender(d)}`,
  },
  friend_coming: {
    audience: "friends", priority: "urgent", icon: "🏃‍♀️", client: true, alwaysPush: true,
    title: () => "Bloomy 💗", body: (d) => `${name(d)} ирж байна 🏃‍♀️`, url: "/friends", groupKey: (d) => `coming_${sender(d)}`,
  },
  friend_secret_alert: {
    audience: "friends", priority: "urgent", icon: "🤫", client: true, pref: "friends_enabled",
    title: () => "Bloomy 💗", body: (d) => `${name(d)} чамд нууц мессеж илгээлээ 🤫`, url: "/friends", groupKey: (d) => `secret_${sender(d)}`,
  },
  friend_added: {
    audience: "friends", priority: "quiet", icon: "🌸", client: true, pref: "friends_enabled",
    title: () => "Bloomy", body: () => "Шинэ найз нэмэгдлээ 🌸", url: "/friends", groupKey: () => "friend_added",
  },
  // ---------- Guardians ----------
  supply_request: {
    audience: "guardians", priority: "normal", icon: "🛍️", client: true, pref: "guardian_enabled", rateLimitMinutes: 30,
    title: () => "Bloomy", body: (d) => `${name(d)} танд хүсэлт илгээлээ`, url: "/mother/supplies", groupKey: (d) => `supply_${sender(d)}`,
  },
  guardian_signal: {
    audience: "guardians", priority: "normal", icon: "📣", client: true, pref: "guardian_enabled",
    title: () => "Bloomy", body: (d) => `${name(d)} танд дохио илгээлээ`, url: "/mother/messages", groupKey: (d) => `signal_${sender(d)}`,
  },
  first_period: {
    audience: "guardians", priority: "normal", icon: "🌸", client: true, pref: "guardian_enabled",
    title: () => "Bloomy", body: (d) => `${name(d)}-д онцгой мэдээ байна 🌸`, url: "/mother/calendar", groupKey: (d) => `first_period_${sender(d)}`,
  },
  mood_shared: {
    audience: "guardians", priority: "quiet", icon: "💗", client: true, pref: "guardian_enabled", permission: "share_mood",
    title: () => "Bloomy", body: (d) => `${name(d)} өнөөдрийн мэдрэмжээ хуваалцлаа`, url: "/mother/messages", groupKey: (d) => `mood_${sender(d)}`,
  },
  link_request: {
    audience: "guardians", priority: "normal", icon: "🔗", client: false, pref: "guardian_enabled",
    title: () => "Bloomy", body: () => "Шинэ холболтын хүсэлт ирлээ", url: "/profile", groupKey: () => "link_request",
  },
  period_confirmed: {
    audience: "guardians", priority: "normal", icon: "🌸", client: false, pref: "guardian_enabled",
    title: () => "Bloomy", body: (d) => `${name(d)}-д онцгой мэдээ байна 🌸`, url: "/mother/calendar", groupKey: (d) => `period_confirmed_${sender(d)}`,
  },
  // ---------- Daughter ----------
  guardian_message: {
    audience: "daughter", priority: "normal", icon: "💌", client: true, pref: "guardian_enabled",
    title: () => "Bloomy", body: () => "Танд шинэ мессеж ирлээ 💌", url: "/daughter/messages", groupKey: () => "guardian_message",
  },
  cycle_reminder: {
    audience: "daughter", priority: "quiet", icon: "🎒", client: false, pref: "reminders_enabled", fixedTime: { hour: 17, minute: 0 },
    title: () => "Bloomy", body: () => "Цүнхээ шалгах цаг боллоо 🎒", url: "/daughter/supplies", groupKey: () => "cycle_reminder",
  },
  bloomy_answer: {
    audience: "daughter", priority: "normal", icon: "💌", client: false,
    title: () => "Bloomy", body: () => "Блүми эгч хариуллаа 💌", url: "/daughter/insights", groupKey: () => "bloomy_answer",
  },
  supplies_low: {
    audience: "daughter", priority: "quiet", icon: "🎒", client: false, pref: "reminders_enabled",
    title: () => "Bloomy", body: () => "Цүнхээ нэг шалгаарай 🎒", url: "/daughter/supplies", groupKey: () => "supplies_low",
  },
  guardian_logged_period: {
    audience: "daughter", priority: "quiet", icon: "📅", client: false, pref: "guardian_enabled",
    title: () => "Bloomy", body: () => "Шалгах зүйл байна 📅", url: "/daughter", groupKey: () => "guardian_logged_period",
  },
  diary_reminder: {
    audience: "daughter", priority: "quiet", icon: "📔", client: false, requirePref: "diary_reminder", fixedTime: { hour: 20, minute: 0 },
    title: () => "Bloomy", body: () => "Өнөөдөр ямар байв? 📔", url: "/daughter", groupKey: () => "diary_reminder",
  },
  // ---------- Inbox only ----------
  sent_copy: {
    audience: "self", priority: "quiet", icon: "📤", client: true, push: false,
    title: () => "Bloomy", body: () => "Илгээсэн мэдэгдэл", url: "/mother/messages", groupKey: () => "sent_copy",
  },
} satisfies Record<string, EventConfig>;

export type EventName = keyof typeof EVENTS;
export const isEventName = (value: unknown): value is EventName => typeof value === "string" && Object.hasOwn(EVENTS, value);
export const eventConfig = (event: EventName): EventConfig => EVENTS[event];

/** Words that must never reach a lock screen. */
// (\b does not work for Cyrillic, so "пад" is matched as a whole word by hand.)
export const LOCK_SCREEN_FORBIDDEN = /сарын\s*тэмдэг|(^|[^а-яёөү])пад(?![а-яёөү])|өвд|цус|тампон|хэвлий/i;
