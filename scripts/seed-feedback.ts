/**
 * DEV ONLY — fills feedback tables with ~30 fake responses per role (+ micro
 * feedback) so /admin/feedback has something to show.
 *
 *   bun run seed:feedback            # add fake rows
 *   bun run seed:feedback --clear    # remove only the rows this script added
 *
 * Fake rows use random user ids that start with "00000000-feed-" and contain no personal data.
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (bun reads .env.local).
 */
import { createClient } from "@supabase/supabase-js";

if (process.env.NODE_ENV === "production") throw new Error("seed-feedback is dev-only");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

const FAKE_PREFIX = "00000000-feed-";
const fakeId = (n: number) => `${FAKE_PREFIX}4000-8000-${String(n).padStart(12, "0")}`;
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const maybe = <T,>(value: T, chance = 0.85) => (Math.random() < chance ? value : null);
const daysAgo = () => new Date(Date.now() - Math.floor(Math.random() * 40) * 86_400_000 - Math.floor(Math.random() * 86_400_000)).toISOString();

if (process.argv.includes("--clear")) {
  for (const table of ["feedback_surveys", "feedback_micro", "feedback_state"]) {
    // uuid has no LIKE: delete the fake id range instead.
    const { error } = await admin.from(table).delete().gte("user_id", `${FAKE_PREFIX}0000-0000-000000000000`).lte("user_id", `${FAKE_PREFIX}ffff-ffff-ffffffffffff`);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log("Removed fake feedback rows.");
  process.exit(0);
}

const FEATURES = ["helper", "friends", "today", "learn", "avatar"];
const IDEAS = ["Илүү олон хувцас", "Найзтайгаа тоглоом", "Илүү олон хичээл", "Дүрэндээ тэжээвэр амьтан", "Шөнийн өнгө"];
const IMPROVE = ["Охины мэдээллийг илүү тодорхой харуулах", "Зөвлөгөө илүү олон", "Мэдэгдэл бага зэрэг олон байна", "Хэрэглэл худалдаж авах холбоос"];

const surveys = [
  ...Array.from({ length: 30 }, (_, index) => {
    const favorite = maybe(pick(FEATURES));
    const againFeature = pick(FEATURES.filter((feature) => feature !== favorite));
    const worried = Math.random() < 0.25;
    return {
      user_id: fakeId(index), role: "daughter", app_version: "seed", created_at: daysAgo(),
      answers: {
        smiley: maybe(pick([3, 4, 4, 5, 5, 5, 2])),
        favorite,
        again: { feature: againFeature, answer: maybe(pick(["yes", "yes", "maybe", "no"])) },
        embarrassment: maybe(pick(["less", "less", "less", "same", "same", "more"])),
        embarrassmentWording: worried ? "worried" : "embarrassed",
        idea: maybe(pick(IDEAS), 0.4),
      },
    };
  }),
  ...Array.from({ length: 30 }, (_, index) => ({
    user_id: fakeId(100 + index), role: "guardian", app_version: "seed", created_at: daysAgo(),
    answers: {
      nps: maybe(pick([10, 10, 9, 9, 8, 7, 6, 4])),
      ease: maybe(pick([3, 4, 4, 5, 5])),
      helpedTalk: maybe(pick(["yes", "yes", "some", "no"])),
      trust: maybe(pick([3, 4, 5, 5])),
      pay: maybe(pick(["yes", "maybe", "maybe", "no"])),
      improve: maybe(pick(IMPROVE), 0.4),
    },
  })),
];

const micro = Array.from({ length: 160 }, (_, index) => {
  const type = pick(["bloomy_answer", "bloomy_answer", "lesson", "forecast", "sos"]);
  const target = type === "lesson" ? pick(["pad-guide", "pad-usage-disposal", "guardian-male-guide"])
    : type === "bloomy_answer" ? `${pick(["ai", "auto"])}:seed${Math.floor(Math.random() * 6)}`
      : type === "forecast" ? `2026-10-01:day_${1 + Math.floor(Math.random() * 28)}` : `seed-${index}`;
  return {
    user_id: fakeId(200 + index), target_type: type, target_id: target, created_at: daysAgo(),
    value: type === "sos" ? pick(["yes", "yes", "no"]) : pick(["up", "up", "up", "down"]),
  };
});

const surveyResult = await admin.from("feedback_surveys").insert(surveys);
if (surveyResult.error) throw new Error(`feedback_surveys: ${surveyResult.error.message}`);
const microResult = await admin.from("feedback_micro").insert(micro);
if (microResult.error) throw new Error(`feedback_micro: ${microResult.error.message}`);
console.log(`Seeded ${surveys.length} surveys (30 daughter, 30 guardian) and ${micro.length} micro answers.`);
