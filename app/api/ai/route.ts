/**
 * POST /api/ai — Bloomy-ийн AI (Gemini эсвэл Claude API).
 *
 * • API түлхүүр зөвхөн сервер дээр (.env.local → ``GEMINI_API_KEY`` эсвэл ANTHROPIC_API_KEY). Утсанд хэзээ ч очихгүй.
 * • Зөвхөн нэвтэрсэн хэрэглэгч ашиглана (Supabase access token шалгана).
 * • Хариу JSON. Алдаа гарвал апп бэлэн текст рүү шилжинэ.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

// GEMINI_API_KEY байвал Gemini, үгүй бол Claude ашиглана
async function generate(prompt: string, maxTokens: number): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SAFETY }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens * 4, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.candidates?.[0]?.content?.parts ?? []).filter((p: any) => !p.thought).map((p: any) => p.text ?? "").join("");
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: SAFETY,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
}

const PHASE_MN: Record<string, string> = {
  period: "сарын тэмдгийн үе",
  follicular: "дааврын тэнцвэрт (фолликулын) үе",
  ovulation: "овуляцийн үе",
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

function buildCyclePredictionPrompt(body: any) {
  const rawEntries = Array.isArray(body.entries) ? body.entries.slice(-60) : [];
  const entries = rawEntries.flatMap((entry: any) => {
    if (!entry || typeof entry.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) return [];
    const daysBeforePeriod = Number(entry.daysBeforePeriod);
    if (![3, 4, 5].includes(daysBeforePeriod)) return [];
    const values: Record<string, string> = {};
    Object.entries(CYCLE_LOG_VALUES).forEach(([category, allowed]) => {
      const value = entry.values?.[category];
      if (typeof value === "string" && allowed.includes(value)) values[category] = value;
    });
    if (!Object.keys(values).length) return [];
    return [{ date: entry.date, daysBeforePeriod, values }];
  });
  return {
    maxTokens: 650,
    prompt: `Чи өсвөр насны хэрэглэгчид зориулсан мөчлөгийн өмнөх хувийн ажиглалт гаргана. Оролтын бүртгэлүүд нь өмнөх мөчлөгүүдийн сарын тэмдэг ирэхээс 3–5 хоногийн өмнөх өдрүүдийнх. Зөвхөн өгөгдөлд байгаа давтагдсан хэв маягийг хэл; цөөн эсвэл нэг мөчлөгийн мэдээллээс баттай дүгнэлт бүү хий. Стресс, PMS зэрэг онош мэт үг бүү хэрэглэ, ирээдүйн мэдрэмжийг баталгаатай мэт бүү өгүүл. Таамаг гэдгийг зөөлөн тодотго. Зөвлөгөө нь энгийн, аюулгүй, өсвөр насанд тохирсон байг: тайван амьсгалах, амрах, унтахын өмнө дэлгэцээ багасгах, тогтмол хоол/ус уух зэрэг. Эм, эмчилгээ, калори эсвэл жин хасах зөвлөгөө өгөхгүй. Хүчтэй өвдөлт, их цус алдалт, ухаан балартах мэдээлэл байвал итгэдэг том хүн, эмчтэй ярилцахыг зөвлө.
Өгөгдөл: ${JSON.stringify({ daysUntilExpectedPeriod: [3, 4, 5].includes(Number(body.daysUntil)) ? Number(body.daysUntil) : null, previousPrePeriodEntries: entries })}
ЗӨВХӨН JSON буцаа: {"prediction":"ирэх хэд хоногийн болгоомжтой таамаг, 1-2 өгүүлбэр","pattern":"бүртгэлээс ажиглагдсан давтагдсан хэв маяг эсвэл өгөгдөл хүрэлцэхгүй тухай","tips":["хийж болох зөвлөгөө 1","зөвлөгөө 2","зөвлөгөө 3"],"confidence":"low эсвэл moderate","dataNote":"өгөгдлийн хүрэлцээ болон таамаг гэдгийг тайлбарласан богино өгүүлбэр"}`,
  };
}

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

const SAFETY = `Чи "Bloomy" апп-ын зөөлөн, найрсаг туслах. Хэрэглэгчид нь Монголын 10–18 насны охид болон тэдний асран хамгаалагчид.
Дүрэм:
- Зөвхөн энгийн, найрсаг монгол хэлээр бич. Богино байх.
- Ямар ч эмийн нэр, тун, хэмжээ бүү зөвлө. Онош бүү тавь.
- Хүчтэй өвдөлт, хэт их цус алдалт, ухаан балартах зэрэг шинж дурдагдвал том хүн, эмчид хандахыг зөвлө.
- Хоолны дэглэм, жин хасах, калори тоолох талаар бүү зөвлө.
- Бие махбодийг ичгүүртэй зүйл гэж бүү хандаарай; ичгүүргүй, эерэг байлга.
- Хариугаа ЗӨВХӨН JSON хэлбэрээр, өөр текстгүй буцаа.`;

function buildPrompt(body: any): { prompt: string; maxTokens: number } | null {
  if (body.type === "cycle_summary") return buildCycleSummaryPrompt(body);
  if (body.type === "cycle_prediction") return buildCyclePredictionPrompt(body);
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
          .map((item: any) => `${item.role === "user" ? "Охин" : "Блүми эгч"}: ${String(item.content ?? "").trim().slice(0, 600)}`)
      : [];
    if (!messages.length) return null;
    return {
      maxTokens: 400,
      prompt: `Чи "Блүми эгч" — 10–18 насны охидын итгэлт, дулаан эгч шиг туслах. Охинтой хийсэн чат:
${messages.join("\n")}
Охины сүүлийн мессежид өмнөх яриаг харгалзан хариул. 2–4 богино өгүүлбэр, энгийн үгтэй, 1–2 тохирох эможитой. Бие махбод, сарын тэмдэг, сэтгэл санаа, найз нөхөд, сургуулийн талаар ичгүүргүй, эерэгээр тайлбарла. Чи хүн биш, эмч биш автомат туслах гэдгээ асуувал шударгаар хэл. Хувийн мэдээлэл (хаяг, утас, сургуулийн нэр) бүү асуу. Хүчирхийлэл, өөрийгөө гэмтээх, аюултай байдал дурдагдвал итгэдэг том хүндээ хэлэх, 108 (хүүхдийн тусламжийн утас) руу залгахыг зөвлө.
"chips" нь охины дараа асууж болох 0–2 богино асуулт (эможитой).
JSON: {"reply": "...", "chips": ["..."]}`,
    };
  }
  if (body.type === "parent_chat") {
    const messages = Array.isArray(body.messages)
      ? body.messages
          .slice(-8)
          .filter((item: any) => item && ["user", "assistant"].includes(item.role))
          .map((item: any) => `${item.role === "user" ? "Асран хамгаалагч" : "Туслах"}: ${String(item.content ?? "").trim().slice(0, 600)}`)
      : [String(body.message ?? "").trim().slice(0, 600)].filter(Boolean).map((message) => `Асран хамгаалагч: ${message}`);
    if (!messages.length) return null;
    return {
      maxTokens: 350,
      prompt: `Асран хамгаалагч болон туслахын чат:
${messages.join("\n")}
Сүүлийн асуултад чатны өмнөх яриаг харгалзан эелдэг, товч хариул. Чатлаж буй хүн нь охины ээж/аав эсвэл асран хамгаалагч гэдгийг сана: түүнд “ээждээ”, “аавдаа”, “итгэдэг том хүндээ ханд” гэж хэзээ ч бүү хэл. Охиноо буруутгахгүй, тайван сонсож, хувийн орон зайг нь хүндэтгэн дэмжихэд чиглэ. Монголын гэр бүлд тохирсон, хэрэгжүүлж болох нэг санаа хэл. Сэдэв өөр байсан ч хариулж болох ч Bloomy аппын зорилготой холбоотой чиглэлд зөөлнөөр тусал. Эмнэлгийн асуудал байвал оношлохгүй, шаардлагатай үед эмчтэй зөвлөлдөхийг зөвлө.
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
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
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
  const built = buildPrompt(body);
  if (!built) return Response.json({ error: "bad_type" }, { status: 400 });

  // 3) AI (Gemini эсвэл Claude)
  try {
    const text = await generate(built.prompt, built.maxTokens);
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
    if (body.type === "cycle_prediction") {
      return Response.json({
        prediction: typeof json.prediction === "string" ? json.prediction.slice(0, 500) : "",
        pattern: typeof json.pattern === "string" ? json.pattern.slice(0, 500) : "",
        tips: Array.isArray(json.tips) ? json.tips.filter((tip: unknown) => typeof tip === "string").slice(0, 3).map((tip: string) => tip.slice(0, 240)) : [],
        confidence: json.confidence === "moderate" ? "moderate" : "low",
        dataNote: typeof json.dataNote === "string" ? json.dataNote.slice(0, 300) : "",
      });
    }
    return Response.json(json);
  } catch (e: any) {
    console.error("AI error:", e?.message);
    return Response.json({ error: "ai_failed" }, { status: 502 });
  }
}
