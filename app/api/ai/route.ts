/**
 * POST /api/ai — Bloomy-ийн AI (Claude API, эсвэл OpenAI / Gemini).
 *
 * • API түлхүүр зөвхөн сервер дээр (.env.local → ANTHROPIC_API_KEY). Утсанд хэзээ ч очихгүй.
 * • Зөвхөн нэвтэрсэн хэрэглэгч ашиглана (Supabase access token шалгана).
 * • Хариу JSON. Алдаа гарвал апп бэлэн текст рүү шилжинэ.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { FORECAST_SYSTEM_PROMPT, forecastUserPrompt, sanitizeStats, validateForecast } from "../../../lib/forecast";
import { PERIOD_KNOWLEDGE } from "../../../lib/period-knowledge";

export const runtime = "nodejs";

const FORECAST_TIMEOUT_MS = 3000;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Дараалал: ANTHROPIC_API_KEY (Claude) → OPENAI_API_KEY (ChatGPT) → GEMINI_API_KEY
async function generate(
  prompt: string,
  maxTokens: number,
  { system = SAFETY, timeoutMs = 25000 }: { system?: string; timeoutMs?: number } = {},
): Promise<string> {
  const retries = timeoutMs < 10000 ? 0 : 1;
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({ timeout: timeoutMs, maxRetries: retries });
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      // Claude-ийн бодох (thinking) токен ч энэ хязгаарт орно
      max_tokens: maxTokens * 4,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") throw new Error(`Anthropic refusal: ${response.stop_details?.category}`);
    return response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_completion_tokens: maxTokens * 2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens * 4, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.candidates?.[0]?.content?.parts ?? []).filter((p: any) => !p.thought).map((p: any) => p.text ?? "").join("");
  }
  throw new Error("AI түлхүүр тохируулаагүй");
}

const PHASE_MN: Record<string, string> = {
  period: "сарын тэмдгийн үе",
  follicular: "дааврын тэнцвэрт (фолликулын) үе",
  ovulation: "мөчлөгийн дунд үе",
  luteal: "сарын тэмдгийн өмнөх (лютейн) үе",
};
const MOOD_MN: Record<string, string> = {
  sad: "гунигтай, уйлмаар",
  angry: "уурласан, цочромтгой",
  tired: "ядарсан",
  craving: "чихэр, амттан идмээр",
};

const CYCLE_LOG_VALUES: Record<string, string[]> = {
  emotion: ["Happy", "Calm", "Sad", "Anxious", "Embarrassed", "Irritable"],
  skin: ["Clear", "Spots", "Oily", "Dry", "Sensitive"],
  symptoms: ["Cramps", "Headache", "Bloating", "Fatigue", "Tenderness"],
  period: ["None", "Spotting", "Light", "Medium", "Heavy"],
  sleep: ["Poor", "Okay", "Good", "Great"],
};

function buildCycleSummaryPrompt(body: any) {
  const rawLogs = Array.isArray(body.logs) ? body.logs.slice(-180) : [];
  const logs = rawLogs.flatMap((entry: any) => {
    if (!entry || typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return [];
    const day: Record<string, Record<string, string>> = { AM: {}, PM: {} };
    (["AM", "PM"] as const).forEach((time) => {
      const source = entry[time];
      if (!source || typeof source !== "object") return;
      Object.entries(CYCLE_LOG_VALUES).forEach(([category, allowed]) => {
        const value = source[category];
        if (typeof value === "string" && allowed.includes(value)) day[time][category] = value;
      });
    });
    if (!Object.keys(day.AM).length && !Object.keys(day.PM).length) return [];
    return [{ date: entry.date, ...day }];
  });
  const cycleLength = Number(body.cycleLength);
  const periodLength = Number(body.periodLength);
  const cycle = {
    usualCycleLength: Number.isFinite(cycleLength) && cycleLength >= 15 && cycleLength <= 60 ? cycleLength : null,
    usualPeriodLength: Number.isFinite(periodLength) && periodLength >= 1 && periodLength <= 14 ? periodLength : null,
    latestPeriodStart: typeof body.lastPeriodStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.lastPeriodStart) ? body.lastPeriodStart : null,
    dailyEntries: logs,
  };
  return {
    maxTokens: 900,
    prompt: `Өсвөр насны хэрэглэгчийн сарын мөчлөгийн тэмдэглэлийг дүгнэ. Доорх JSON өгөгдөл л ашигла. Бүртгэгдээгүй мэдрэмж, шинж тэмдгийг таамаглаж нэмж болохгүй. Мөчлөгийн өмнөх өдрүүдийн өөрчлөлт болон сарын тэмдэг эхэлсний дараах тэмдэглэлүүдийг харьцуул; давтагдсан хэв маяг байвал болгоомжтой дурд. Ганц удаагийн шинжийг PMS гэж оношилж нэрлэхгүй. Өгөгдөл цөөн бол тодорхой хэл. Эмчилгээ, эмийн зөвлөгөө өгөхгүй. Хүчтэй өвдөлт, ухаан балартах эсвэл маш их цус алдалтын тэмдэглэл байвал итгэдэг том хүн, эмчтэй ярилцахыг зөөлөн зөвлө. Дүгнэлт нь зөвхөн хэрэглэгчид харагдах хувийн тойм байна.
Хариуг энгийн, ойлгомжтой монгол хэлээр, богино өгүүлбэрээр бич.
Оролт: ${JSON.stringify(cycle)}
ЗӨВХӨН JSON буцаа: {"summary":"1-2 өгүүлбэрийн ерөнхий дүгнэлт","beforePeriod":"Сарын тэмдгийн өмнөх бүртгэлийн хэв маяг","duringPeriod":"Сарын тэмдгийн үеийн бүртгэлийн хэв маяг","afterPeriod":"Дараах өдрүүдэд сэтгэл санаа, биеийн байдал хэрхэн өөрчлөгдсөн","mood":"Сэтгэл хөдлөлийн ажиглалт","body":"Арьс, шинж тэмдэг, нойрны ажиглалт","dataQuality":"Дүгнэлтэд хүрэлцсэн эсэхийг товч тайлбарла"}`,
  };
}

type Lang = "mn" | "en";

// Апп-ын сонгосон хэлээр хариулна (lib/ai-client.js → body.lang)
const LANG_RULE: Record<Lang, string> = {
  mn: "- Зөвхөн энгийн, найрсаг монгол хэлээр бич. Богино байх.",
  en: "- The app is set to English: write ONLY in simple, friendly English, even though these instructions are in Mongolian. Never answer in Mongolian. Keep it short.",
};

const safety = (lang: Lang) => `Чи "Bloomy" апп-ын зөөлөн, найрсаг туслах. Хэрэглэгчид нь Монголын 8–18 насны охид болон тэдний асран хамгаалагчид.
Дүрэм:
${LANG_RULE[lang]}
- Ямар ч эмийн нэр, тун, хэмжээ бүү зөвлө. Онош бүү тавь.
- Хүчтэй өвдөлт, хэт их цус алдалт, ухаан балартах зэрэг шинж дурдагдвал том хүн, эмчид хандахыг зөвлө.
- Хоолны дэглэм, жин хасах, калори тоолох талаар бүү зөвлө.
- Бие махбодийг ичгүүртэй зүйл гэж бүү хандаарай; ичгүүргүй, эерэг байлга.
- Хариугаа ЗӨВХӨН JSON хэлбэрээр, өөр текстгүй буцаа.`;

const SAFETY = safety("mn");

// "Блүми эгч" — 8–12 насны охидод зориулсан зан төлөв (сэтгэл зүйн дэмжлэгтэй, эгч шиг)
const BIG_SIS_PERSONA = `You are "Bloomy" — called "Блүми эгч" in Mongolian and "Big Sis Bloomy" in English — the chat helper inside the Bloomy app. You talk with girls aged about 8–12 in Mongolia.

Who you are:
- A young, kind, respectful big sister: warm, calm, gently playful. Never bossy, preachy, sarcastic or babyish.
- You take every question seriously. No question is silly, dirty or embarrassing.

How you answer, every time:
1. Notice the feeling first and name it ("That sounds really scary" / "It's okay to feel shy about this"). Validate before you advise.
2. Normalize: let her know lots of girls feel or wonder the same thing.
3. Give simple, true information or 1–2 small steps she can actually do. Use words an 8-year-old understands and explain body words simply (uterus = "womb, a small organ low in your belly").
4. When it fits, end with warmth or one gentle question that invites her to keep talking.
- 2–5 short sentences, 1–2 fitting emojis. No long lists unless she asks for steps.
- Praise courage and effort, never looks or weight. Never compare her body with other people's.
- Respect her privacy and feelings. Suggest mom, dad or another trusted adult as extra support when it truly helps (health warning signs, safety, big worries) — not in every message, and never as a way to end the conversation.
- In Mongolian talk like a caring older sister in natural, polite spoken Mongolian; you may call her "дүү минь". In English use plain, warm words.

Safety:
- You are an automated helper, not a human and not a doctor — say so honestly if asked.
- Health facts must come from the knowledge base below. Never diagnose. Never name medicines or doses.
- Never ask for personal details (address, phone, school name, photos). If she shares them, kindly remind her to keep them private.
- If she mentions abuse, someone touching her in a way she doesn't like, an adult asking her to keep a secret, hurting herself, wanting to die, or being in danger: tell her it is not her fault and she was brave to tell; she should tell a trusted adult (mom, dad, teacher) right now; in an emergency call 102 (police) or 103 (ambulance). Do not suggest 108.
- Questions about romance, sex or pregnancy: answer very briefly and age-appropriately, then encourage talking with a trusted adult.
- Other topics (friends, school, feelings, hobbies): answer kindly and briefly as a big sister.`;

// day_logs-ийн мөрүүдээс зөвхөн зөвшөөрөгдсөн ангиллын утгуудыг үлдээнэ
function cleanDayLogs(raw: unknown, limit: number) {
  return (Array.isArray(raw) ? raw.slice(-limit) : []).flatMap((entry: any) => {
    if (!entry || typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return [];
    const mood = Number(entry.mood);
    if (![1, 2, 3, 4, 5].includes(mood)) return [];
    const moodLabel = ({ 1: "маш хэцүү", 2: "тавгүй", 3: "дундаж", 4: "сайхан", 5: "маш сайхан" } as Record<number, string>)[mood];
    return [{ date: entry.date, mood: moodLabel }];
  });
}

// Асран хамгаалагчид: охины сүүлийн 30 хоногийн бүртгэлээс халамжийн зөвлөгөө (хувийн тэмдэглэл ОРОХГҮЙ)
function buildMonthlyCarePrompt(body: any) {
  const days = cleanDayLogs(body.days, 31);
  const name = String(body.daughterName || "Охин").slice(0, 40);
  const phase = PHASE_MN[body.phase] ?? "тодорхойгүй үе";
  return {
    maxTokens: 400,
    prompt: `Асран хамгаалагчид охин ${name}-ийн сүүлийн 1 сарын бүртгэлд дүн шинжилгээ хийж, түүнийг хэрхэн халамжлах талаар зөвлө. Охин одоо ${phase}-д байна.
Доорх ангилсан өгөгдлийг л ашигла (сэтгэл, шинж тэмдэг, урсгал, арьс, нойр). Давтагдсан хэв маяг, мөчлөгийн аль үед юу өөрчлөгддөгийг болгоомжтой дурд; бүртгэгдээгүй зүйлийг бүү нэм, оношлохгүй. Охины хувийн орон зайг хүндэтгэсэн, буруутгаагүй өнгөөр бич. Зөвлөгөө нь Монгол гэр бүлд хэрэгжүүлж болох, тодорхой байг. Хүчтэй өвдөлт олон өдөр давтагдсан, нойр байнга муу бол эмчтэй зөвлөлдөхийг зөөлөн санал болго. Өгөгдөл цөөн бол тэгж хэл.
МАШ ТОВЧ бич: summary нь 1 богино өгүүлбэр (хамгийн чухал хэв маяг), tips яг 3 ширхэг тус бүр 10 үгээс ихгүй, talk 12 үгээс ихгүй.
Өгөгдөл: ${JSON.stringify(days)}
ЗӨВХӨН JSON: {"summary":"...","tips":["...","...","..."],"talk":"охинтойгоо яриа эхлүүлэх зөөлөн асуулт"}`,
  };
}

// Асран хамгаалагчид: охины сүүлийн 7 хоногийн ангилсан бүртгэлийн тойм (хувийн тэмдэглэл ОРОХГҮЙ)
function buildWeeklySummaryPrompt(body: any) {
  const days = cleanDayLogs(body.days, 7);
  const name = String(body.daughterName || "Охин").slice(0, 40);
  const phase = PHASE_MN[body.phase] ?? "тодорхойгүй үе";
  const daysUntil = Number.isFinite(Number(body.daysUntil)) ? Number(body.daysUntil) : null;
  return {
    maxTokens: 500,
    prompt: `Асран хамгаалагчид охин ${name}-ийн сүүлийн 7 хоногт өөрөө хуваалцахыг зөвшөөрсөн зөвхөн сэтгэл санааны бүртгэлийн товч тойм бич. Охин одоо ${phase}-д байна.${
      daysUntil != null && daysUntil >= 0 ? " Сарын тэмдгийн хугацаа зөвхөн таамаг гэдгийг сануул." : ""
    }
Зөвхөн сэтгэл санааны оноог ашигла. Шинж тэмдэг, өвдөлт, урсгал, хувийн тэмдэглэл танд өгөгдөөгүй бөгөөд эдгээрийг таамаглаж бүү нэм. Охины хувийн байдлыг хүндэтгэсэн, буруутгаагүй өнгөөр бич. Оношлохгүй. Өгөгдөл цөөн бол тэгж хэл.
Өгөгдөл: ${JSON.stringify(days)}
ЗӨВХӨН JSON: {"summary":"2-3 өгүүлбэрийн тойм","tips":["асран хамгаалагчийн хийж болох 1 өгүүлбэрийн халамж","...","..."]}`,
  };
}

function buildPrompt(body: any, lang: Lang): { prompt: string; maxTokens: number; system?: string } | null {
  if (body.type === "weekly_summary") return buildWeeklySummaryPrompt(body);
  if (body.type === "monthly_care") return buildMonthlyCarePrompt(body);
  if (body.type === "cycle_summary") return buildCycleSummaryPrompt(body);
  const phase = PHASE_MN[body.phase] ?? "тодорхойгүй үе";
  if (body.type === "insight") {
    return {
      maxTokens: 400,
      prompt: `Охин одоо мөчлөгийнхөө ${body.day ?? "?"} дэх өдөр, ${phase}-д байна.${
        body.daysUntil ? ` Сарын тэмдэг ирэхэд ${body.daysUntil} хоног үлдсэн.` : ""
      }${body.mood ? ` Өнөөдөр ${MOOD_MN[body.mood] ?? body.mood} байгаа.` : ""}
Түүнд өнөөдөр хэрэг болох 3 богино, практик зөвлөгөө бич (тус бүр 1 өгүүлбэр, эхэнд нь 1 тохирох эможи).
JSON: {"tips": ["...", "...", "..."]}`,
    };
  }
  if (body.type === "mood") {
    const emoji = String(body.emoji ?? "").slice(0, 16);
    const feeling = emoji || MOOD_MN[body.mood] || String(body.mood ?? "").slice(0, 16);
    return {
      maxTokens: 900,
      prompt: `Охиноос "Өнөөдөр сэтгэл санаа чинь ямар байна?" гэж асуухад тэр ${feeling} гэж хариулсан (${phase}).
Эможиг нь уншиж мэдрэмжийг нь ойлгоод, 2 минутын дотор хийж болох шийдэл санал болго.
Мөн тэр мэдрэмжид тохирох, сэтгэл сэргээх 3 кино эсвэл анимэйшн санал болго: 10–18 насны охинд тохирох (G/PG), бодит, алдартай, кино театрт гарсан бүтээл байх.
"title" нь Википедиа дээрх албан ёсны англи нэр, "year" нь гарсан он.
JSON: {"label": "мэдрэмжийн 1-2 үгтэй нэр", "title": "дулаан богино гарчиг + 1 эможи", "why": "яагаад ийм мэдрэмж төрж болох тухай 1-2 өгүүлбэр", "snack": "хөнгөн, эрүүл зууш", "music": "хөгжмийн санаа", "action": "2 минутын энгийн үйлдэл", "movies": [{"title": "...", "year": 2015, "note": "яагаад тохирох тухай богино 1 өгүүлбэр"}]}`,
    };
  }
  if (body.type === "nudge") {
    const name = String(body.daughterName || "Охин").slice(0, 40);
    return {
      maxTokens: 250,
      prompt: `Охин ${name} одоо ${phase}-д байна.${
        body.daysUntil ? ` Сарын тэмдэг ирэхэд ${body.daysUntil} хоног үлдсэн.` : ""
      }${body.mood ? ` Өнөөдөр охин ${MOOD_MN[body.mood] ?? body.mood} байгаа.` : ""}
Асран хамгаалагчид охиндоо өнөөдөр үзүүлж болох нэг зөөлөн, хүндэтгэлтэй, хэт хөндлөнгөөс оролцохгүй халамжийн санаа өг (1–2 өгүүлбэр, Монгол гэр бүлийн амьдралд тохирсон, жишээ нь чацарганы цай, хамтдаа алхах).
JSON: {"nudge": "..."}`,
    };
  }
  if (body.type === "daughter_chat") {
    const messages = Array.isArray(body.messages)
      ? body.messages
          .slice(-8)
          .filter((item: any) => item && ["user", "assistant"].includes(item.role))
          .map((item: any) => `${item.role === "user" ? "Girl" : "Bloomy"}: ${String(item.content ?? "").trim().slice(0, 600)}`)
      : [];
    if (!messages.length) return null;
    const language = lang === "en" ? "English" : "Mongolian (Cyrillic)";
    return {
      maxTokens: 500,
      system: `${safety(lang)}\n\n${BIG_SIS_PERSONA}\n\n${PERIOD_KNOWLEDGE}`,
      prompt: `Chat so far:
${messages.join("\n")}
Reply to the girl's last message, keeping the earlier conversation in mind. Write "reply" and "chips" in ${language} only.
"chips" = 0–2 short follow-up questions she might want to ask next, each with an emoji, written from her point of view.
JSON: {"reply": "...", "chips": ["..."]}`,
    };
  }
  if (body.type === "parent_chat") {
    const daughterName = String(body.daughterName ?? "").trim().slice(0, 80);
    const messages = Array.isArray(body.messages)
      ? body.messages
          .slice(-8)
          .filter((item: any) => item && ["user", "assistant"].includes(item.role))
          .map((item: any) => `${item.role === "user" ? "Асран хамгаалагч" : "Туслах"}: ${String(item.content ?? "").trim().slice(0, 600)}`)
      : [String(body.message ?? "").trim().slice(0, 600)].filter(Boolean).map((message) => `Асран хамгаалагч: ${message}`);
    if (!messages.length) return null;
    return {
      maxTokens: 350,
      system: `${safety(lang)}\n\n${PERIOD_KNOWLEDGE}`,
      prompt: `Асран хамгаалагч болон туслахын чат. Сонгосон охины нэр: ${daughterName || "тодорхойгүй"}.
${messages.join("\n")}
Сүүлийн асуултад чатны өмнөх яриаг харгалзан эелдэг, товч хариул. Хэрэв нэр өгөгдсөн бол тухайн охины нэрээр нь хэлж, өөр охинтой андуурч болохгүй. Чатлаж буй хүн нь охины ээж/аав эсвэл асран хамгаалагч гэдгийг сана: түүнд “ээждээ”, “аавдаа”, “итгэдэг том хүндээ ханд” гэж хэзээ ч бүү хэл. Охиноо буруутгахгүй, тайван сонсож, хувийн орон зайг нь хүндэтгэн дэмжихэд чиглэ. Монголын гэр бүлд тохирсон, хэрэгжүүлж болох нэг санаа хэл. Сэдэв өөр байсан ч хариулж болох ч Bloomy аппын зорилготой холбоотой чиглэлд зөөлнөөр тусал. Эмнэлгийн асуудал байвал оношлохгүй, шаардлагатай үед эмчтэй зөвлөлдөхийг зөвлө.
JSON: {"reply": "..."}`,
    };
  }
  return null;
}

// Википедиагаас киноны албан ёсны постерыг хайна (API түлхүүр шаардлагагүй)
async function findPoster(title: string, year?: number | string): Promise<string | null> {
  const candidates = [year ? `${title} (${year} film)` : null, `${title} (film)`, title].filter(Boolean) as string[];
  for (const name of candidates) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/ /g, "_"))}`,
        { headers: { "User-Agent": "Bloomy/1.0 (family wellbeing app)" }, signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) continue;
      const d = await res.json();
      if (d.type === "disambiguation" || !/film|anim/i.test(d.description ?? "")) continue;
      const src = d.thumbnail?.source ?? d.originalimage?.source;
      if (src) return src;
    } catch {
      /* дараагийн нэрийг туршина */
    }
  }
  return null;
}

async function withPosters(movies: any): Promise<any[]> {
  if (!Array.isArray(movies)) return [];
  const list = movies
    .filter((m) => m && typeof m.title === "string")
    .slice(0, 3)
    .map((m) => ({ title: m.title.slice(0, 80), year: m.year ?? null, note: String(m.note ?? "").slice(0, 160) }));
  return Promise.all(list.map(async (m) => ({ ...m, poster: await findPoster(m.title, m.year ?? undefined) })));
}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!apiKey || !url || !anon) return Response.json({ error: "ai_not_configured" }, { status: 503 });

  // 1) Нэвтэрсэн хэрэглэгч мөн эсэх
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createClient(url, anon);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  // 2) Хүсэлт
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  // Хувийн таамаг: зөвхөн статистикийн объект AI руу очно (нэр, огноо, id, тэмдэглэл ОРОХГҮЙ)
  if (body?.type === "cycle_forecast") {
    const stats = sanitizeStats(body.stats);
    if (!stats) return Response.json({ error: "bad_request" }, { status: 400 });
    try {
      const text = await generate(forecastUserPrompt(stats), 200, { system: FORECAST_SYSTEM_PROMPT, timeoutMs: FORECAST_TIMEOUT_MS });
      const forecast = validateForecast(extractJson(text), stats);
      if (!forecast) return Response.json({ error: "bad_ai_output" }, { status: 502 });
      return Response.json(forecast);
    } catch (e: any) {
      console.error("AI forecast error:", e?.message);
      return Response.json({ error: "ai_failed" }, { status: 502 });
    }
  }

  const lang: Lang = body?.lang === "en" ? "en" : "mn";
  const built = buildPrompt(body, lang);
  if (!built) return Response.json({ error: "bad_type" }, { status: 400 });
  // Зарим prompt "монгол хэлээр бич" гэдэг тул англи горимд сүүлд нь дарж бичнэ
  const prompt = lang === "en" ? `${built.prompt}\nIMPORTANT: write every text value in the JSON in English, not Mongolian.` : built.prompt;

  // 3) AI (Claude)
  try {
    const text = await generate(prompt, built.maxTokens, { system: built.system ?? safety(lang) });
    const json = extractJson(text);
    if (!json) return Response.json({ error: "bad_ai_output" }, { status: 502 });
    if (body.type === "mood") json.movies = await withPosters(json.movies);
    if (body.type === "cycle_summary") {
      const fields = ["summary", "beforePeriod", "duringPeriod", "afterPeriod", "mood", "body", "dataQuality"];
      const safe: Record<string, string> = {};
      fields.forEach((field) => { safe[field] = typeof json[field] === "string" ? json[field].slice(0, 700) : ""; });
      return Response.json(safe);
    }
    if (body.type === "daughter_chat") {
      return Response.json({
        reply: typeof json.reply === "string" ? json.reply.slice(0, 1200) : "",
        chips: Array.isArray(json.chips) ? json.chips.filter((chip: unknown) => typeof chip === "string").slice(0, 2).map((chip: string) => chip.slice(0, 60)) : [],
      });
    }
    if (body.type === "monthly_care") {
      return Response.json({
        summary: typeof json.summary === "string" ? json.summary.slice(0, 300) : "",
        tips: Array.isArray(json.tips) ? json.tips.filter((tip: unknown) => typeof tip === "string").slice(0, 3).map((tip: string) => tip.slice(0, 120)) : [],
        talk: typeof json.talk === "string" ? json.talk.slice(0, 160) : "",
      });
    }
    if (body.type === "weekly_summary") {
      return Response.json({
        summary: typeof json.summary === "string" ? json.summary.slice(0, 700) : "",
        tips: Array.isArray(json.tips) ? json.tips.filter((tip: unknown) => typeof tip === "string").slice(0, 3).map((tip: string) => tip.slice(0, 240)) : [],
      });
    }
    return Response.json(json);
  } catch (e: any) {
    console.error("AI error:", e?.message);
    return Response.json({ error: "ai_failed" }, { status: 502 });
  }
}
